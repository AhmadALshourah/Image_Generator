"""Owner-mode JWT auth (#14).

Single-user model: there's exactly one owner, configured via
`OWNER_USERNAME` + `OWNER_PASSWORD`. When `AUTH_ENABLED=false` (default),
no auth is required and write endpoints are open — fine for local dev / demos.

When enabled, write endpoints (POST /api/generate, DELETE /api/images/{id},
POST /api/images/{id}/tags) require a Bearer JWT obtained from `/api/auth/login`.
Reads stay public so the gallery can be shared.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# auto_error=False so an absent header doesn't 403 when auth is disabled.
_bearer = HTTPBearer(auto_error=False)


def verify_password(plain: str, expected: str) -> bool:
    """Verify `plain` against `expected`.

    Convention: if `expected` looks like a bcrypt hash (`$2b$…`) we use bcrypt;
    otherwise we fall back to constant-time string compare (so you can set a
    plain password in dev without bcrypt-hashing it first).
    """
    if not expected:
        return False
    if expected.startswith("$2"):
        try:
            return _pwd_context.verify(plain, expected)
        except Exception:  # noqa: BLE001
            return False
    return _constant_time_eq(plain, expected)


def _constant_time_eq(a: str, b: str) -> bool:
    if len(a) != len(b):
        return False
    diff = 0
    for x, y in zip(a, b):
        diff |= ord(x) ^ ord(y)
    return diff == 0


def issue_token(settings: Settings, *, subject: str) -> tuple[str, int]:
    """Sign a JWT and return (token, expires_in_seconds)."""
    ttl = timedelta(hours=settings.jwt_ttl_hours)
    now = datetime.now(timezone.utc)
    payload = {"sub": subject, "iat": now, "exp": now + ttl}
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, int(ttl.total_seconds())


def decode_token(settings: Settings, token: str) -> str:
    """Return the subject claim, or raise HTTP 401."""
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


# ---- FastAPI dependencies -----------------------------------------------

def current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> str | None:
    """Return the authenticated username, or None if no Bearer present."""
    if credentials is None:
        return None
    return decode_token(settings, credentials.credentials)


def require_owner(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> str:
    """Block the request unless a valid owner JWT is present.

    When AUTH_ENABLED=false this dependency is a no-op (returns "anonymous"),
    so the same router code works in both modes.
    """
    if not settings.auth_enabled:
        return "anonymous"

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    subject = decode_token(settings, credentials.credentials)
    if subject != settings.owner_username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can perform this action",
        )
    return subject
