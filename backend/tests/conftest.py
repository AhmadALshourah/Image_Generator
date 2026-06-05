"""Shared pytest fixtures.

The two big concerns: every test gets a fresh in-memory SQLite DB, and every
test gets a fake AsyncOpenAI client that returns canned responses (no real
API calls, no real network).
"""
import base64
import io
import os
from typing import AsyncIterator
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import Image as PILImage
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# IMPORTANT: set env vars before any app import so pydantic-settings is happy.
os.environ.setdefault("OPENAI_API_KEY", "sk-test-dummy")
os.environ.setdefault("CORS_ORIGINS", "http://localhost")
# Disable rate limiting in tests so repeated generate calls don't get 429.
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

from app.config import get_settings
from app.database import Base, get_db
from app.main import create_app
from app.services import openai_client as openai_client_module
from app.storage.factory import get_storage_backend


def _make_tiny_png_b64() -> str:
    """A real 4×4 PNG, base64-encoded — exercises Pillow + tEXt embedding."""
    img = PILImage.new("RGB", (4, 4), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


TINY_PNG_B64 = _make_tiny_png_b64()


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def test_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def test_session(test_engine) -> AsyncIterator[AsyncSession]:
    SessionLocal = async_sessionmaker(
        test_engine, expire_on_commit=False, class_=AsyncSession
    )
    async with SessionLocal() as session:
        yield session


# ---------------------------------------------------------------------------
# OpenAI mock
# ---------------------------------------------------------------------------

def _make_default_mock_openai() -> MagicMock:
    """Build a MagicMock that mimics the parts of AsyncOpenAI we actually use."""
    fake = MagicMock(name="AsyncOpenAI")

    # images.generate → returns a single base64-encoded PNG
    image_data = MagicMock()
    image_data.b64_json = TINY_PNG_B64
    image_response = MagicMock()
    image_response.data = [image_data]
    fake.images.generate = AsyncMock(return_value=image_response)

    # moderations.create → not flagged by default
    mod_categories = MagicMock()
    mod_categories.model_dump.return_value = {}
    mod_result = MagicMock()
    mod_result.flagged = False
    mod_result.categories = mod_categories
    mod_response = MagicMock()
    mod_response.results = [mod_result]
    fake.moderations.create = AsyncMock(return_value=mod_response)

    # chat.completions.create → echo back a canned enhanced/translated prompt
    chat_choice = MagicMock()
    chat_choice.message.content = "An enhanced, richly-detailed English prompt."
    chat_response = MagicMock()
    chat_response.choices = [chat_choice]
    fake.chat.completions.create = AsyncMock(return_value=chat_response)

    # embeddings.create → 1536-dim fake vector for similar-prompts demos
    embed_data = MagicMock()
    embed_data.embedding = [0.001] * 1536
    embed_response = MagicMock()
    embed_response.data = [embed_data]
    fake.embeddings.create = AsyncMock(return_value=embed_response)

    return fake


@pytest.fixture
def mock_openai(monkeypatch) -> MagicMock:
    """Replace get_openai_client() so every service sees the same fake."""
    fake = _make_default_mock_openai()

    # Defeat the lru_cache by replacing the function itself.
    monkeypatch.setattr(openai_client_module, "get_openai_client", lambda: fake)
    # And in case other modules imported the symbol by name:
    monkeypatch.setattr(
        "app.services.gpt_image_service.get_openai_client", lambda: fake
    )
    monkeypatch.setattr(
        "app.services.moderation_service.get_openai_client", lambda: fake
    )
    monkeypatch.setattr(
        "app.services.prompt_service.get_openai_client", lambda: fake
    )
    monkeypatch.setattr(
        "app.services.embedding_service.get_openai_client", lambda: fake
    )
    return fake


def set_moderation_flagged(mock_openai: MagicMock, *categories: str) -> None:
    """Helper to flip the moderation mock into 'flagged' mode for a test."""
    cats = MagicMock()
    cats.model_dump.return_value = {name: True for name in categories} or {"sexual": True}
    result = MagicMock()
    result.flagged = True
    result.categories = cats
    response = MagicMock()
    response.results = [result]
    mock_openai.moderations.create.return_value = response


def set_translation(mock_openai: MagicMock, text: str) -> None:
    """Configure the GPT-4o-mini mock to return a specific translation/enhancement."""
    choice = MagicMock()
    choice.message.content = text
    response = MagicMock()
    response.choices = [choice]
    mock_openai.chat.completions.create.return_value = response


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client(
    test_session, mock_openai, tmp_path, monkeypatch
) -> AsyncIterator[AsyncClient]:
    # Redirect all file IO to a temp dir so tests can't trash each other.
    images_dir = tmp_path / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr("app.services.storage_service.IMAGES_DIR", images_dir)
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    get_settings.cache_clear()
    get_storage_backend.cache_clear()

    app = create_app()

    async def _get_db_override():
        yield test_session

    app.dependency_overrides[get_db] = _get_db_override

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
