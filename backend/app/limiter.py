"""Per-IP rate limiter for the generate endpoints.

Uses slowapi (thin Starlette wrapper around limits).  The limiter is a
module-level singleton so all requests share the same in-memory counter.

Wiring (handled in app/main.py):
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

Usage (route decorator):
    @router.post("/generate", ...)
    @limiter.limit(generate_rate_limit)
    async def generate(http_request: Request, ...):
        ...
"""
from __future__ import annotations

from slowapi import Limiter
from starlette.requests import Request


# ---------------------------------------------------------------------------
# Key function — respects X-Forwarded-For for reverse-proxy deployments.
# Falls back to "anonymous" when there is no client (e.g. ASGI test transport).
# ---------------------------------------------------------------------------

def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "anonymous"


# ---------------------------------------------------------------------------
# Dynamic limit — reads from settings at request time so the value can be
# overridden via env var without restarting.  When rate limiting is disabled
# (e.g. tests, local dev), a very high ceiling is returned so the decorator
# is effectively a no-op.
# ---------------------------------------------------------------------------

def generate_rate_limit() -> str:
    from app.config import get_settings

    settings = get_settings()
    if not settings.rate_limit_enabled:
        return "999999/minute"
    return f"{settings.rate_limit_per_minute}/minute"


limiter = Limiter(key_func=_get_client_ip)
