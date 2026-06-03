"""Correlation-ID middleware.

Generates (or reuses an inbound) `X-Request-ID`, binds it into structlog's
contextvars so every subsequent log line in the request's task includes it,
and echoes it back on the response.

Pair this with `logging_config.configure_logging()` and you can grep a single
request across the entire log stream — even across async hops.
"""
from __future__ import annotations

import logging
import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-ID"

logger = logging.getLogger("app.request")


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())

        # Fresh context per request — every log line in this task picks it up.
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.exception("request failed", extra={"elapsed_ms": round(elapsed_ms, 1)})
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "request completed",
            extra={
                "status_code": response.status_code,
                "elapsed_ms": round(elapsed_ms, 1),
            },
        )

        response.headers[REQUEST_ID_HEADER] = request_id
        return response
