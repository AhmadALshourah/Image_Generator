"""Structured logging setup.

Routes every `logging.getLogger(__name__)` call through `structlog`, so existing
`logger.info(...)` / `logger.exception(...)` calls automatically get:

  - JSON output in production / Docker  (LOG_FORMAT=json)
  - Pretty colorized output in local dev (LOG_FORMAT=console)
  - An ISO timestamp on every line
  - The `request_id` (correlation ID) bound by RequestIDMiddleware
  - Stack info on errors

Existing code does NOT need to change — the same `logger = logging.getLogger(__name__)`
pattern works, but every log line gets the request_id automatically.
"""
from __future__ import annotations

import logging
import sys

import structlog
from structlog.types import EventDict, Processor

from app.config import LogFormat


def _drop_uvicorn_access_color_message(_logger, _method_name, event_dict: EventDict) -> EventDict:
    """uvicorn.access logs already contain ANSI codes — strip the redundant key."""
    event_dict.pop("color_message", None)
    return event_dict


def configure_logging(*, log_level: str = "INFO", log_format: LogFormat = "console") -> None:
    """Wire up structlog + stdlib logging.

    Safe to call multiple times — the handler set is replaced each call.
    """
    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)

    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        timestamper,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        _drop_uvicorn_access_color_message,
    ]

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    renderer: Processor
    if log_format == "json":
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(log_level)

    # Quiet down a few noisy libraries.
    for noisy in ("httpx", "httpcore", "openai._base_client"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
