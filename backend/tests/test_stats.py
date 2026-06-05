"""Tests for GET /api/stats."""
import pytest


PAYLOAD = {
    "prompt": "a serene mountain lake",
    "size": "1024x1024",
    "quality": "auto",
    "background": "auto",
    "output_format": "png",
    "force": True,
}


async def test_stats_empty_gallery(client):
    r = await client.get("/api/stats")
    assert r.status_code == 200
    body = r.json()
    assert body["total_images"] == 0
    assert body["total_cost_usd"] == 0.0
    assert body["cached_count"] == 0
    assert body["translated_count"] == 0
    assert body["by_quality"] == {}
    assert body["by_size"] == {}
    assert body["by_day"] == []


async def test_stats_after_one_generation(client, mock_openai):
    await client.post("/api/generate", json=PAYLOAD)

    r = await client.get("/api/stats")
    assert r.status_code == 200
    body = r.json()
    assert body["total_images"] == 1
    assert body["by_quality"].get("auto") == 1
    assert body["by_size"].get("1024x1024") == 1
    assert len(body["by_day"]) == 1
    assert body["by_day"][0]["images"] == 1


async def test_stats_cache_hit_is_counted(client, mock_openai):
    # First call generates; second call (same prompt, force=False) hits the cache.
    await client.post("/api/generate", json={**PAYLOAD, "force": False})
    await client.post("/api/generate", json={**PAYLOAD, "force": False})

    r = await client.get("/api/stats")
    body = r.json()
    # Only 1 DB row was created (cache hit doesn't create a new row).
    assert body["total_images"] == 1
    # The stats endpoint counts duplicate prompt_hash rows as "cached".
    # With only 1 row, cached_count stays 0.
    assert body["cached_count"] == 0


async def test_stats_multiple_qualities(client, mock_openai):
    qualities = ["low", "medium", "high"]
    for q in qualities:
        await client.post("/api/generate", json={**PAYLOAD, "quality": q, "force": True})

    r = await client.get("/api/stats")
    body = r.json()
    assert body["total_images"] == 3
    for q in qualities:
        assert body["by_quality"][q] == 1


async def test_stats_count_endpoint(client, mock_openai):
    await client.post("/api/generate", json=PAYLOAD)
    r = await client.get("/api/stats/_count")
    assert r.status_code == 200
    assert r.json()["total"] == 1
