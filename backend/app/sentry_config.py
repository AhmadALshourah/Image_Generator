"""Sentry SDK initialisation (#27).

A no-op when `SENTRY_DSN` is empty (the default), so dev / CI / portfolio demos
never accidentally ship telemetry to a stale project. When the DSN is set —
e.g. in a docker-compose with a real backend — full FastAPI + SQLAlchemy +
asyncio instrumentation kicks in automatically.
"""
from __future__ import annotations

import logging

from app.config import Settings

logger = logging.getLogger(__name__)


def configure_sentry(settings: Settings) -> None:
    if not settings.sentry_dsn:
        return

    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        send_default_pii=False,
        integrations=[
            StarletteIntegration(),
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
    )
    logger.info("sentry initialised", extra={"environment": settings.sentry_environment})
