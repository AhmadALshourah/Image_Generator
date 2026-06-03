"""Wrapper around OpenAI's `gpt-image-1` model.

Two entry points:

  * `generate_image(...)`           — single-shot, returns final bytes.
  * `stream_generate_image(...)`    — async generator that yields events as
                                       the model produces partial images, then
                                       a final event with the completed bytes.

Differences from the old DALL-E 3 path:
- Returns base64 image bytes directly (no temporary URL → no download step).
- Supports `background` (transparent / opaque / auto).
- Supports new quality levels (low / medium / high / auto).
- Supports multiple output formats (png / jpeg / webp).
- Supports streaming with `partial_images=3` so the UI can fade in progressive
  renders the same way ChatGPT does.
"""
from __future__ import annotations

import base64
import logging
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Literal

from fastapi import HTTPException, status
from openai import OpenAIError

from app.schemas import GenerateRequest
from app.services.openai_client import get_openai_client

logger = logging.getLogger(__name__)


@dataclass
class GenerationResult:
    image_bytes: bytes
    output_format: str  # png / jpeg / webp


@dataclass
class StreamPartial:
    """Intermediate render emitted while gpt-image-1 is still working."""

    type: Literal["partial"] = "partial"
    index: int = 0
    b64_json: str = ""


@dataclass
class StreamCompleted:
    """Final image bytes — terminal event of the stream."""

    type: Literal["completed"] = "completed"
    image_bytes: bytes = b""
    output_format: str = "png"


StreamEvent = StreamPartial | StreamCompleted


async def generate_image(request: GenerateRequest, effective_prompt: str) -> GenerationResult:
    """Single-shot generation. Used by the legacy non-streaming endpoint."""
    client = get_openai_client()

    try:
        response = await client.images.generate(
            model="gpt-image-1",
            prompt=effective_prompt,
            size=request.size,
            quality=request.quality,
            background=request.background,
            output_format=request.output_format,
            moderation="auto",
            n=1,
        )
    except OpenAIError as exc:
        logger.exception("gpt-image-1 generation failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image provider error: {exc}",
        ) from exc

    data = response.data[0]
    b64_payload = getattr(data, "b64_json", None)
    if not b64_payload:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image provider returned no image data.",
        )

    try:
        image_bytes = base64.b64decode(b64_payload)
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image provider returned malformed image data.",
        ) from exc

    return GenerationResult(image_bytes=image_bytes, output_format=request.output_format)


async def stream_generate_image(
    request: GenerateRequest, effective_prompt: str
) -> AsyncIterator[StreamEvent]:
    """Stream partial renders + the final image.

    Yields zero or more `StreamPartial` events as gpt-image-1 emits progressive
    previews, then exactly one terminal `StreamCompleted` carrying the full bytes.

    Raises `HTTPException(502)` if the provider stream errors before completing.
    """
    client = get_openai_client()

    try:
        stream = await client.images.generate(
            model="gpt-image-1",
            prompt=effective_prompt,
            size=request.size,
            quality=request.quality,
            background=request.background,
            output_format=request.output_format,
            moderation="auto",
            n=1,
            stream=True,
            partial_images=3,
        )
    except OpenAIError as exc:
        logger.exception("gpt-image-1 stream start failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image provider error: {exc}",
        ) from exc

    final_b64: str | None = None

    try:
        async for event in stream:
            event_type = getattr(event, "type", "")

            if event_type.endswith("partial_image"):
                b64 = getattr(event, "b64_json", None)
                if not b64:
                    continue
                idx = getattr(event, "partial_image_index", 0)
                yield StreamPartial(index=int(idx), b64_json=b64)

            elif event_type.endswith("completed"):
                final_b64 = getattr(event, "b64_json", None)
    except OpenAIError as exc:
        logger.exception("gpt-image-1 stream failed mid-flight")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image provider error during stream: {exc}",
        ) from exc

    if not final_b64:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image provider stream closed without a final image.",
        )

    try:
        image_bytes = base64.b64decode(final_b64)
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image provider returned malformed final image.",
        ) from exc

    yield StreamCompleted(image_bytes=image_bytes, output_format=request.output_format)
