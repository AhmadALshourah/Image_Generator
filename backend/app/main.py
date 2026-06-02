from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.routers import images, prompt
from app.services.storage_service import IMAGES_DIR


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="AI Image Generator API",
        description=(
            "FastAPI backend that generates images via OpenAI gpt-image-1, "
            "stores them locally, and exposes a gallery."
        ),
        version="3.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount(
        "/api/images/files",
        StaticFiles(directory=str(IMAGES_DIR), check_dir=False),
        name="image-files",
    )

    app.include_router(images.router)
    app.include_router(prompt.router)

    return app


app = create_app()
