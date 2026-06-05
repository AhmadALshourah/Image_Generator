"""Owner-mode JWT auth (#14).

DB-based single-user model: one owner account stored in the `users` table.
Registration is open only when no account exists yet (first-time setup).
After that, login checks the DB and issues a JWT.

When `AUTH_ENABLED=false`, write endpoints are open (anonymous) — still useful
for local dev/demos without any login prompt.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_db

logger = logging.getLogger(__name__)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# auto_error=False so an absent header doesn't 403 when auth is disabled.
_bearer = HTTPBearer(auto_error=False)


# ---- Password helpers -------------------------------------------------------

def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return _pwd_context.verify(plain, hashed)
    except Exception:  # noqa: BLE001
        return False


# ---- DB helpers -------------------------------------------------------------

async def get_user(db: AsyncSession, username: str):
    from app.models import User
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def user_exists(db: AsyncSession) -> bool:
    from app.models import User
    result = await db.execute(select(func.count()).select_from(User))
    return (result.scalar() or 0) > 0


async def create_user(db: AsyncSession, username: str, plain_password: str):
    from app.models import User
    user = User(username=username, hashed_password=hash_password(plain_password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ---- Token helpers ----------------------------------------------------------

def issue_token(settings: Settings, *, subject: str) -> tuple[str, int]:
    ttl = timedelta(hours=settings.jwt_ttl_hours)
    now = datetime.now(timezone.utc)
    payload = {"sub": subject, "iat": now, "exp": now + ttl}
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, int(ttl.total_seconds())


def decode_token(settings: Settings, token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    sub = payload.get("sub")
    if not isinstance(sub, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has no subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return sub


# ---- FastAPI dependencies ---------------------------------------------------

def current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> str | None:
    if credentials is None:
        return None
    return decode_token(settings, credentials.credentials)


async def require_owner(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
) -> str:
    if not settings.auth_enabled:
        return "anonymous"

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    subject = decode_token(settings, credentials.credentials)
    user = await get_user(db, subject)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found",
        )
    return subject
