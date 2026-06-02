"""Wrapper around OpenAI's `gpt-image-1` model.

Differences from the old DALL-E 3 path:
- Returns base64 image bytes directly (no temporary URL → no download step).
- Supports `background` (transparent / opaque / auto).
- Supports new quality levels (low / medium / high / auto).
- Supports multiple output formats (png / jpeg / webp).
- Supports more sizes (1024×1024, 1024×1536, 1536×1024, auto).
"""
import base64
import logging
from dataclasses import dataclass

from fastapi import HTTPException, status
from openai import OpenAIError

from app.schemas import GenerateRequest
from app.services.openai_client import get_openai_client

logger = logging.getLogger(__name__)


@dataclass
class GenerationResult:
    image_bytes: bytes
    output_format: str  # actual format returned (png/jpeg/webp)


async def generate_image(request: GenerateRequest, effective_prompt: str) -> GenerationResult:
    """Call gpt-image-1 with the effective (translated/normalized) prompt."""
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
