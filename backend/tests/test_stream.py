"""Tests for POST /api/generate/stream — SSE streaming endpoint.

Verifies the event sequence, stage transitions, error events, and cache path.
"""
import json
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


def _parse_sse(raw: bytes) -> list[dict]:
    """Parse a raw SSE response body into a list of {event, data} dicts."""
    events = []
    current: dict = {}

    for line in raw.decode().splitlines():
        if line.startswith("event:"):
            current["event"] = line[len("event:"):].strip()
        elif line.startswith("data:"):
            current["data"] = line[len("data:"):].strip()
        elif line == "" and current:
            if "event" in current and "data" in current:
                try:
                    current["parsed"] = json.loads(current["data"])
                except json.JSONDecodeError:
                    pass
            events.append(current)
            current = {}

    return events


@pytest.mark.asyncio
async def test_stream_happy_path_event_sequence(client, mock_openai):
    """Stream returns: stage(moderating) → stage(cache_check) →
    stage(generating) → partial × 3 → stage(saving) → complete."""
    response = await client.post("/api/generate/stream", json=VALID_PAYLOAD)
    assert response.status_code == 200, response.text
    assert "text/event-stream" in response.headers.get("content-type", "")

    events = _parse_sse(response.content)
    event_names = [e["event"] for e in events]

    # Must contain at least one stage event and end with complete
    assert "stage" in event_names
    assert event_names[-1] == "complete"

    # Complete payload must be a valid ImageRecord
    complete_data = events[-1]["parsed"]
    assert complete_data["prompt"] == VALID_PAYLOAD["prompt"]
    assert complete_data["cached"] is False
    assert "image_url" in complete_data


@pytest.mark.asyncio
async def test_stream_contains_stage_events(client, mock_openai):
    """All expected pipeline stages appear as SSE stage events."""
    response = await client.post("/api/generate/stream", json=VALID_PAYLOAD)
    assert response.status_code == 200

    events = _parse_sse(response.content)
    stage_events = [e for e in events if e["event"] == "stage"]
    stages_seen = {e["parsed"]["stage"] for e in stage_events if "parsed" in e}

    assert "moderating" in stages_seen
    assert "generating" in stages_seen
    assert "saving" in stages_seen


@pytest.mark.asyncio
async def test_stream_contains_partial_images(client, mock_openai):
    """At least one partial event with b64_json is emitted during generation."""
    response = await client.post("/api/generate/stream", json=VALID_PAYLOAD)
    assert response.status_code == 200

    events = _parse_sse(response.content)
    partial_events = [e for e in events if e["event"] == "partial"]

    assert len(partial_events) >= 1
    for ev in partial_events:
        assert "b64_json" in ev.get("parsed", {})
        assert "index" in ev.get("parsed", {})


@pytest.mark.asyncio
async def test_stream_error_event_on_moderation_fail(client, mock_openai):
    """A flagged prompt triggers an error event instead of a complete event."""
    set_moderation_flagged(mock_openai, "sexual")

    response = await client.post("/api/generate/stream", json=VALID_PAYLOAD)
    assert response.status_code == 200  # HTTP 200 — error is inside the stream

    events = _parse_sse(response.content)
    event_names = [e["event"] for e in events]

    assert "error" in event_names
    assert "complete" not in event_names

    error_event = next(e for e in events if e["event"] == "error")
    assert "detail" in error_event.get("parsed", {})


@pytest.mark.asyncio
async def test_stream_cache_hit_returns_cached_complete(client, mock_openai):
    """Second identical request returns a complete event with cached=true."""
    # First request — generates and stores
    await client.post("/api/generate/stream", json=VALID_PAYLOAD)

    # Second request — should hit cache
    response = await client.post("/api/generate/stream", json=VALID_PAYLOAD)
    assert response.status_code == 200

    events = _parse_sse(response.content)
    complete_events = [e for e in events if e["event"] == "complete"]
    assert len(complete_events) == 1
    assert complete_events[0]["parsed"]["cached"] is True


@pytest.mark.asyncio
async def test_stream_arabic_prompt_translates(client, mock_openai):
    """Arabic prompt triggers a translating stage event with effective_prompt."""
    set_translation(mock_openai, "A serene mountain lake at sunrise")

    payload = {**VALID_PAYLOAD, "prompt": "بحيرة جبلية هادئة عند الشروق"}
    response = await client.post("/api/generate/stream", json=payload)
    assert response.status_code == 200

    events = _parse_sse(response.content)
    stage_events = {
        e["parsed"]["stage"]: e["parsed"]
        for e in events
        if e["event"] == "stage" and "parsed" in e
    }

    # "translating" stage fires first (no effective_prompt yet).
    # "translated" stage follows with the effective_prompt once translation is done.
    assert "translating" in stage_events
    assert "translated" in stage_events
    assert "effective_prompt" in stage_events["translated"]


@pytest.mark.asyncio
async def test_stream_short_prompt_returns_422(client, mock_openai):
    """Prompt shorter than 3 chars is rejected before the stream opens."""
    bad_payload = {**VALID_PAYLOAD, "prompt": "hi"}
    response = await client.post("/api/generate/stream", json=bad_payload)
    assert response.status_code == 422
