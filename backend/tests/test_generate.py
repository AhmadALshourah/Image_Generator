"""Tests for POST /api/generate — the heart of the app.

We exercise every branch of the pipeline:
    moderation → translate → cache lookup → gpt-image-1 → save + thumbnail.
"""
import pytest

from tests.conftest import set_moderation_flagged, set_translation


VALID_PAYLOAD = {
    "prompt": "a serene mountain lake at sunrise",
    "size": "1024x1024",
    "quality": "auto",
    "background": "auto",
    "output_format": "png",
    "force": False,
}


async def test_generate_happy_path(client, mock_openai):
    response = await client.post("/api/generate", json=VALID_PAYLOAD)
    assert response.status_code == 201, response.text

    body = response.json()
    assert body["prompt"] == VALID_PAYLOAD["prompt"]
    assert body["effective_prompt"] == VALID_PAYLOAD["prompt"]  # English, no translation
    assert body["was_translated"] is False
    assert body["cached"] is False
    assert body["filename"].endswith(".png")
    assert body["thumbnail_filename"].endswith(".webp")
    assert body["image_url"].startswith("/api/images/files/")
    assert body["thumbnail_url"].startswith("/api/images/files/")

    # The model was called exactly once.
    assert mock_openai.images.generate.await_count == 1
    # Moderation was called exactly once.
    assert mock_openai.moderations.create.await_count == 1


async def test_generate_cache_hit_skips_model(client, mock_openai):
    # First call → cache miss → real generation.
    first = await client.post("/api/generate", json=VALID_PAYLOAD)
    assert first.status_code == 201
    assert first.json()["cached"] is False
    assert mock_openai.images.generate.await_count == 1

    # Second call → same hash → cache hit → no extra model call.
    second = await client.post("/api/generate", json=VALID_PAYLOAD)
    assert second.status_code == 201
    body = second.json()
    assert body["cached"] is True
    assert body["id"] == first.json()["id"]  # same row returned
    assert mock_openai.images.generate.await_count == 1  # unchanged


async def test_generate_force_bypasses_cache(client, mock_openai):
    first = await client.post("/api/generate", json=VALID_PAYLOAD)
    assert first.status_code == 201

    second = await client.post(
        "/api/generate", json={**VALID_PAYLOAD, "force": True}
    )
    assert second.status_code == 201
    assert second.json()["cached"] is False
    assert second.json()["id"] != first.json()["id"]
    assert mock_openai.images.generate.await_count == 2


async def test_generate_arabic_prompt_is_translated(client, mock_openai):
    set_translation(mock_openai, "A regal cat floating among nebulae and stars.")

    arabic_payload = {**VALID_PAYLOAD, "prompt": "قطة ملكية تطفو بين السدم والنجوم"}
    response = await client.post("/api/generate", json=arabic_payload)

    assert response.status_code == 201
    body = response.json()
    assert body["was_translated"] is True
    assert body["prompt"] == arabic_payload["prompt"]
    assert body["effective_prompt"] == "A regal cat floating among nebulae and stars."

    # Translation = 1 GPT call, then image generation = 1 image call.
    assert mock_openai.chat.completions.create.await_count == 1
    assert mock_openai.images.generate.await_count == 1


async def test_generate_blocked_by_moderation(client, mock_openai):
    set_moderation_flagged(mock_openai, "violence", "hate")

    response = await client.post("/api/generate", json=VALID_PAYLOAD)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "blocked" in detail.lower()
    assert "violence" in detail or "hate" in detail

    # We must not have called the image model after a moderation block.
    assert mock_openai.images.generate.await_count == 0


async def test_generate_validation_errors_on_short_prompt(client):
    response = await client.post("/api/generate", json={**VALID_PAYLOAD, "prompt": "ab"})
    assert response.status_code == 422


@pytest.mark.parametrize("size", ["1024x1024", "1024x1536", "1536x1024", "auto"])
async def test_generate_accepts_all_sizes(client, mock_openai, size):
    response = await client.post("/api/generate", json={**VALID_PAYLOAD, "size": size, "force": True})
    assert response.status_code == 201
    assert response.json()["size"] == size
