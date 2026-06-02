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
