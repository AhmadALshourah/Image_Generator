"""Tests for GET /api/prompts/similar."""
import pytest

from tests.conftest import set_translation


PAYLOAD = {
    "prompt": "a cat sitting on a rooftop",
    "size": "1024x1024",
    "quality": "auto",
    "background": "auto",
    "output_format": "png",
    "force": True,
}


async def test_similar_prompts_empty_gallery(client):
    r = await client.get("/api/prompts/similar", params={"q": "a cat"})
    assert r.status_code == 200
    body = r.json()
    assert body["query"] == "a cat"
    assert body["items"] == []


async def test_similar_prompts_requires_min_length(client):
    r = await client.get("/api/prompts/similar", params={"q": "x"})
    assert r.status_code == 422  # fails the min_length=2 validator


async def test_similar_prompts_returns_items_when_embeddings_exist(client, mock_openai):
    # Generate an image so there's a stored embedding.
    gen_r = await client.post("/api/generate", json=PAYLOAD)
    assert gen_r.status_code == 201

    # The mock embedding returns [0.001] * 1536 for everything, so cosine
    # similarity between the query and every stored vector is 1.0 — above
    # the 0.55 threshold used by the endpoint.
    r = await client.get("/api/prompts/similar", params={"q": "cat on roof"})
    assert r.status_code == 200
    body = r.json()
    # With at least one embedded image and a matching query the endpoint
    # should return a non-empty list.
    assert len(body["items"]) >= 1
    item = body["items"][0]
    assert "prompt" in item
    assert "score" in item
    assert 0.0 <= item["score"] <= 1.0
    assert "thumbnail_url" in item


async def test_similar_prompts_top_k_limits_results(client, mock_openai):
    # Seed 3 images.
    for i in range(3):
        await client.post(
            "/api/generate",
            json={**PAYLOAD, "prompt": f"image number {i}", "force": True},
        )

    r = await client.get("/api/prompts/similar", params={"q": "image number", "top_k": 2})
    assert r.status_code == 200
    assert len(r.json()["items"]) <= 2


async def test_similar_prompts_embeddings_disabled(client, mock_openai, monkeypatch):
    # If embeddings are disabled the embed_text service returns None, and the
    # endpoint should return an empty list gracefully (not 500).
    from unittest.mock import AsyncMock

    monkeypatch.setattr(
        "app.routers.prompts.embedding_service.embed_text",
        AsyncMock(return_value=None),
    )
    r = await client.get("/api/prompts/similar", params={"q": "a cat"})
    assert r.status_code == 200
    assert r.json()["items"] == []
