import base64
import logging

from fastapi import HTTPException, status
from openai import OpenAIError

from app.services.openai_client import get_openai_client

logger = logging.getLogger(__name__)


async def assert_prompt_allowed(prompt: str) -> None:
    """Run the prompt through OpenAI's Moderation API.

    Raises HTTPException(400) if the content is flagged.
    Free, fast (<100ms), and required for any public deployment.
    """
    client = get_openai_client()

    try:
        result = await client.moderations.create(
            model="omni-moderation-latest",
            input=prompt,
        )
    except OpenAIError as exc:
        # Moderation failures should NOT block legitimate users.
        logger.warning("Moderation API unavailable, allowing prompt through: %s", exc)
        return

    flagged = result.results[0]
    if not flagged.flagged:
        return

    triggered = [name for name, value in flagged.categories.model_dump().items() if value]
    detail = (
        "Your prompt was blocked by content moderation."
        + (f" Flagged categories: {', '.join(triggered)}." if triggered else "")
    )
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


async def moderate_image_output(image_bytes: bytes, output_format: str) -> None:
    """Optional second-pass moderation on the generated image bytes.

    Only runs when ``OUTPUT_MODERATION_ENABLED=true`` in the environment.
    Uses ``omni-moderation-latest`` with a base64 data URI so the image never
    needs to be publicly reachable.

    Raises ``HTTPException(422)`` if the output image is flagged — this is
    deliberately a different status code from the prompt check (400) so callers
    can distinguish input vs output violations.

    Moderation failures (network errors, API outages) are logged and silently
    swallowed — we never want a moderation-service outage to block legitimate
    users.
    """
    from app.config import get_settings

    if not get_settings().output_moderation_enabled:
        return

    client = get_openai_client()
    mime_type = f"image/{output_format if output_format != 'jpg' else 'jpeg'}"
    b64_data = base64.b64encode(image_bytes).decode("ascii")
    data_uri = f"data:{mime_type};base64,{b64_data}"

    try:
        result = await client.moderations.create(
            model="omni-moderation-latest",
            input=[{"type": "image_url", "image_url": {"url": data_uri}}],
        )
    except OpenAIError as exc:
        logger.warning("Output moderation API unavailable, skipping check: %s", exc)
        return

    flagged = result.results[0]
    if not flagged.flagged:
        return

    triggered = [name for name, value in flagged.categories.model_dump().items() if value]
    detail = (
        "The generated image was blocked by content moderation."
        + (f" Flagged categories: {', '.join(triggered)}." if triggered else "")
    )
    logger.warning("Generated image flagged by output moderation: %s", triggered)
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)
