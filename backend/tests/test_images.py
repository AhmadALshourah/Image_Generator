"""Tests for the gallery endpoints: list, get, delete, with search/filter."""
import pytest


PAYLOADS = [
    {
        "prompt": "a serene mountain lake at sunrise",
        "size": "1024x1024",
        "quality": "auto",
        "background": "auto",
        "output_format": "png",
        "force": True,
    },
    {
        "prompt": "a futuristic city skyline at night",
        "size": "1536x1024",
        "quality": "high",
        "background": "opaque",
        "output_format": "webp",
        "force": True,
    },
    {
        "prompt": "abstract floating geometric shapes",
        "size": "1024x1536",
        "quality": "medium",
        "background": "transparent",
        "output_format": "png",
        "force": True,
    },
]


@pytest.fixture
async def seeded(client, mock_openai):
    """Insert 3 distinct images via the API."""
    created = []
    for payload in PAYLOADS:
        r = await client.post("/api/generate", json=payload)
        assert r.status_code == 201
        created.append(r.json())
    return created


async def test_list_empty_initially(client):
    r = await client.get("/api/images")
    assert r.status_code == 200
    body = r.json()
    assert body["items"] == []
    assert body["total"] == 0


async def test_list_returns_all(client, seeded):
    r = await client.get("/api/images")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3
    # newest first
    prompts = [item["prompt"] for item in body["items"]]
    assert prompts[0] == PAYLOADS[-1]["prompt"]


async def test_list_pagination(client, seeded):
    r = await client.get("/api/images?limit=2&offset=0")
    assert r.status_code == 200
    page1 = r.json()
    assert len(page1["items"]) == 2
    assert page1["total"] == 3

    r2 = await client.get("/api/images?limit=2&offset=2")
    page2 = r2.json()
    assert len(page2["items"]) == 1
    # No overlap between pages.
    ids_seen = {i["id"] for i in page1["items"]} | {i["id"] for i in page2["items"]}
    assert len(ids_seen) == 3


async def test_list_filter_by_search_q(client, seeded):
    r = await client.get("/api/images?q=mountain")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 1
    assert "mountain" in items[0]["prompt"]


async def test_list_filter_by_size(client, seeded):
    r = await client.get("/api/images?size=1536x1024")
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["size"] == "1536x1024"


async def test_list_filter_by_background(client, seeded):
    r = await client.get("/api/images?background=transparent")
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["background"] == "transparent"


async def test_list_filters_combined(client, seeded):
    r = await client.get("/api/images?q=abstract&background=transparent")
    items = r.json()["items"]
    assert len(items) == 1


async def test_get_single_image(client, seeded):
    target = seeded[0]
    r = await client.get(f"/api/images/{target['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == target["id"]


async def test_get_404(client):
    r = await client.get("/api/images/99999")
    assert r.status_code == 404


async def test_delete_image(client, seeded):
    target = seeded[0]
    r = await client.delete(f"/api/images/{target['id']}")
    assert r.status_code == 200
    assert r.json() == {"deleted": True, "id": target["id"]}

    # No longer in list.
    listing = await client.get("/api/images")
    ids = [i["id"] for i in listing.json()["items"]]
    assert target["id"] not in ids


async def test_delete_404(client):
    r = await client.delete("/api/images/99999")
    assert r.status_code == 404
