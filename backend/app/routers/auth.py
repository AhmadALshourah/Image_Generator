"""Auth endpoints (#14)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.schemas import AuthStatusResponse, LoginRequest, LoginResponse
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    if not settings.auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Auth is disabled. Login is not available.",
        )

    if request.username != settings.owner_username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not auth_service.verify_password(request.password, settings.owner_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token, expires_in = auth_service.issue_token(settings, subject=request.username)
    return LoginResponse(access_token=token, expires_in=expires_in)


@router.get("/status", response_model=AuthStatusResponse)
async def status_endpoint(
    settings: Settings = Depends(get_settings),
    current: str | None = Depends(auth_service.current_user_optional),
) -> AuthStatusResponse:
    return AuthStatusResponse(
        auth_enabled=settings.auth_enabled,
        is_authenticated=current is not None,
        username=current,
    )
