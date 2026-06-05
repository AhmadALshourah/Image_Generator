"""Tests for GET /api/tags and PUT /api/images/{id}/tags."""
import pytest


PAYLOAD = {
    "prompt": "a cat on a rooftop",
    "size": "1024x1024",
    "quality": "auto",
    "background": "auto",
    "output_format": "png",
    "force": True,
}


async def test_list_tags_empty(client):
    r = await client.get("/api/tags")
    assert r.status_code == 200
    assert r.json() == {"items": []}


async def test_set_tags_on_image(client, mock_openai):
    # Generate an image to get an id.
    gen_r = await client.post("/api/generate", json=PAYLOAD)
    assert gen_r.status_code == 201
    image_id = gen_r.json()["id"]

    # Assign two tags.
    r = await client.put(f"/api/images/{image_id}/tags", json={"tags": ["nature", "cats"]})
    assert r.status_code == 200
    body = r.json()
    tag_names = {t["name"] for t in body["tags"]}
    assert tag_names == {"nature", "cats"}


async def test_list_tags_after_assignment(client, mock_openai):
    gen_r = await client.post("/api/generate", json=PAYLOAD)
    assert gen_r.status_code == 201
    image_id = gen_r.json()["id"]

    await client.put(f"/api/images/{image_id}/tags", json={"tags": ["nature", "cats"]})

    r = await client.get("/api/tags")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 2
    names = {item["name"] for item in items}
    assert names == {"nature", "cats"}
    # Every tag should report image_count == 1.
    for item in items:
        assert item["image_count"] == 1


async def test_replace_tags_on_image(client, mock_openai):
    gen_r = await client.post("/api/generate", json=PAYLOAD)
    image_id = gen_r.json()["id"]

    await client.put(f"/api/images/{image_id}/tags", json={"tags": ["nature"]})
    r = await client.put(f"/api/images/{image_id}/tags", json={"tags": ["urban", "night"]})
    assert r.status_code == 200
    tag_names = {t["name"] for t in r.json()["tags"]}
    assert tag_names == {"urban", "night"}


async def test_set_tags_returns_404_for_missing_image(client):
    r = await client.put("/api/images/99999/tags", json={"tags": ["anything"]})
    assert r.status_code == 404


async def test_gallery_filter_by_tag(client, mock_openai):
    gen_r = await client.post("/api/generate", json=PAYLOAD)
    image_id = gen_r.json()["id"]
    await client.put(f"/api/images/{image_id}/tags", json={"tags": ["featured"]})

    r = await client.get("/api/images", params={"tag": "featured"})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == image_id
