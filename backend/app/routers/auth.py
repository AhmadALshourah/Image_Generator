"""Auth endpoints (#14)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_db
from app.schemas import AuthStatusResponse, LoginRequest, LoginResponse, RegisterRequest
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    # Check username uniqueness
    if await auth_service.get_user(db, request.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken.",
        )
    # Check email uniqueness
    if await auth_service.get_user_by_email(db, request.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    await auth_service.create_user(db, request.username, request.password, email=request.email)
    token, expires_in = auth_service.issue_token(settings, subject=request.username)
    return LoginResponse(access_token=token, token_type="bearer", expires_in=expires_in)


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    if not settings.auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Auth is disabled.",
        )
    user = await auth_service.get_user(db, request.username)
    if user is None or not auth_service.verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    token, expires_in = auth_service.issue_token(settings, subject=request.username)
    return LoginResponse(access_token=token, token_type="bearer", expires_in=expires_in)


@router.get("/status", response_model=AuthStatusResponse)
async def status_endpoint(
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current: str | None = Depends(auth_service.current_user_optional),
) -> AuthStatusResponse:
    has_user = await auth_service.user_exists(db)

    # Token is valid but the user was deleted from DB → treat as unauthenticated.
    role = "user"
    if current is not None:
        user = await auth_service.get_user(db, current)
        if user is None:
            current = None
        else:
            role = user.role

    return AuthStatusResponse(
        auth_enabled=settings.auth_enabled,
        is_authenticated=current is not None,
        username=current,
        needs_setup=not has_user,
        role=role,
    )
