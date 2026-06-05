"""Tests for POST /api/auth/login and GET /api/auth/status."""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


# ---------------------------------------------------------------------------
# Fixture: a client with AUTH_ENABLED=true and a known plain-text password.
# (verify_password falls back to constant-time string compare for non-bcrypt.)
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def authed_client(test_session, mock_openai, tmp_path, monkeypatch):
    from app.config import get_settings
    from app.storage.factory import get_storage_backend
    from app.database import get_db
    from app.main import create_app

    images_dir = tmp_path / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr("app.services.storage_service.IMAGES_DIR", images_dir)
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_ENABLED", "true")
    monkeypatch.setenv("OWNER_USERNAME", "owner")
    monkeypatch.setenv("OWNER_PASSWORD", "secret")
    monkeypatch.setenv("JWT_SECRET", "test-only-secret")

    get_settings.cache_clear()
    get_storage_backend.cache_clear()

    app = create_app()
    app.dependency_overrides[get_db] = lambda: (yield test_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    get_settings.cache_clear()
    get_storage_backend.cache_clear()


# ---------------------------------------------------------------------------
# /api/auth/status
# ---------------------------------------------------------------------------

async def test_status_auth_disabled(client):
    r = await client.get("/api/auth/status")
    assert r.status_code == 200
    body = r.json()
    assert body["auth_enabled"] is False
    assert body["is_authenticated"] is False
    assert body["username"] is None


async def test_status_auth_enabled_unauthenticated(authed_client):
    r = await authed_client.get("/api/auth/status")
    assert r.status_code == 200
    body = r.json()
    assert body["auth_enabled"] is True
    assert body["is_authenticated"] is False


async def test_status_auth_enabled_with_valid_token(authed_client):
    # Obtain a token first.
    login_r = await authed_client.post(
        "/api/auth/login", json={"username": "owner", "password": "secret"}
    )
    assert login_r.status_code == 200
    token = login_r.json()["access_token"]

    r = await authed_client.get(
        "/api/auth/status", headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["is_authenticated"] is True
    assert body["username"] == "owner"


# ---------------------------------------------------------------------------
# /api/auth/login
# ---------------------------------------------------------------------------

async def test_login_returns_404_when_auth_disabled(client):
    r = await client.post(
        "/api/auth/login", json={"username": "owner", "password": "secret"}
    )
    assert r.status_code == 404


async def test_login_happy_path(authed_client):
    r = await authed_client.post(
        "/api/auth/login", json={"username": "owner", "password": "secret"}
    )
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert isinstance(body["expires_in"], int)
    assert body["expires_in"] > 0


async def test_login_wrong_password(authed_client):
    r = await authed_client.post(
        "/api/auth/login", json={"username": "owner", "password": "wrong"}
    )
    assert r.status_code == 401


async def test_login_wrong_username(authed_client):
    r = await authed_client.post(
        "/api/auth/login", json={"username": "notowner", "password": "secret"}
    )
    assert r.status_code == 401
