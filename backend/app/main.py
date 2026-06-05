import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import init_db
from app.limiter import limiter
from app.logging_config import configure_logging
from app.middleware.request_id import RequestIDMiddleware
from app.routers import auth, images, prompt, prompts, stats, tags
from app.sentry_config import configure_sentry
from app.services.storage_service import IMAGES_DIR


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger = logging.getLogger("app.lifespan")
    await init_db()
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("application started", extra={"model": "gpt-image-1"})
    yield
    logger.info("application shutting down")


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(log_level=settings.log_level, log_format=settings.log_format)
    configure_sentry(settings)

    app = FastAPI(
        title="AI Image Generator API",
        description=(
            "FastAPI backend that generates images via OpenAI gpt-image-1, "
            "stores them locally or in S3, and exposes a gallery with tags, "
            "cost tracking, and embedding-based similar-prompts search."
        ),
        version="4.0.0",
        lifespan=lifespan,
    )

    # Rate-limiter state — must be set before any route handler runs.
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Request-ID before CORS so the header is on every response.
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[
            "X-Request-ID",
            # Rate-limit headers so the browser/client can back off gracefully.
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
            "Retry-After",
        ],
    )

    # Static mount only matters for STORAGE_BACKEND=local. For S3 the URLs
    # are absolute and the browser bypasses the API entirely.
    app.mount(
        "/api/images/files",
        StaticFiles(directory=str(IMAGES_DIR), check_dir=False),
        name="image-files",
    )

    app.include_router(images.router)
    app.include_router(prompt.router)
    app.include_router(prompts.router)
    app.include_router(tags.router)
    app.include_router(stats.router)
    app.include_router(auth.router)

    return app


app = create_app()
