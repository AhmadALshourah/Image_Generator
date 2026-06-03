from unittest.mock import AsyncMock, MagicMock

from openai import OpenAIError

from tests.conftest import set_translation


async def test_enhance_prompt_happy_path(client, mock_openai):
    set_translation(mock_openai, "A breathtaking, ultra-detailed portrait of a cat in space.")

    r = await client.post("/api/enhance-prompt", json={"prompt": "a cat"})
    assert r.status_code == 200

    body = r.json()
    assert body["original"] == "a cat"
    assert body["enhanced"] == "A breathtaking, ultra-detailed portrait of a cat in space."
    assert "created_at" in body


async def test_enhance_prompt_validation(client):
    r = await client.post("/api/enhance-prompt", json={"prompt": "a"})  # too short
    assert r.status_code == 422


async def test_enhance_prompt_empty_response_raises(client, mock_openai):
    # Configure the GPT mock to return an empty string.
    set_translation(mock_openai, "   ")

    r = await client.post("/api/enhance-prompt", json={"prompt": "a cat"})
    assert r.status_code == 502
    assert "empty" in r.json()["detail"].lower()


async def test_enhance_prompt_openai_error(client, mock_openai):
    mock_openai.chat.completions.create = AsyncMock(side_effect=OpenAIError("boom"))

    r = await client.post("/api/enhance-prompt", json={"prompt": "a cat"})
    assert r.status_code == 502
    assert "boom" in r.json()["detail"]
