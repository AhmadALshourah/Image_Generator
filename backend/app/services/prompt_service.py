import logging
import re

from fastapi import HTTPException, status
from openai import OpenAIError

from app.services.openai_client import get_openai_client

logger = logging.getLogger(__name__)

ENHANCE_SYSTEM_PROMPT = (
    "You are a prompt-engineering assistant for an image generation model. "
    "Take the user's short or vague image description and rewrite it into a single, "
    "rich, detailed prompt. Add concrete visual details: subject, setting, lighting, "
    "mood, art style, camera/lens (if photographic), color palette, and composition. "
    "Stay faithful to the user's intent. "
    "Return ONLY the rewritten prompt — no preface, no quotes, no explanation. "
    "Keep it under 400 words. Always respond in English."
)

TRANSLATE_SYSTEM_PROMPT = (
    "You are a translation engine. Translate the user's image prompt from any language "
    "into clear, natural English suitable for an image generation model. "
    "Preserve every detail and nuance. Do not add or remove any visual elements. "
    "Return ONLY the translated English text — no preface, no quotes, no notes."
)

# Unicode ranges for Arabic + Arabic Supplement + Arabic Extended.
_ARABIC_RE = re.compile(r"[؀-ۿݐ-ݿࢠ-ࣿ]")


def looks_arabic(text: str) -> bool:
    """Return True if the text contains a non-trivial amount of Arabic characters."""
    if not text:
        return False
    arabic_chars = _ARABIC_RE.findall(text)
    # A few stray Arabic characters in an otherwise English prompt should not trigger translation.
    return len(arabic_chars) >= 3


async def enhance_prompt(original_prompt: str) -> str:
    client = get_openai_client()

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": ENHANCE_SYSTEM_PROMPT},
                {"role": "user", "content": original_prompt.strip()},
            ],
            temperature=0.8,
            max_tokens=600,
        )
    except OpenAIError as exc:
        logger.exception("Prompt enhancement failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Prompt enhancement provider error: {exc}",
        ) from exc

    enhanced = (response.choices[0].message.content or "").strip()
    if not enhanced:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Prompt enhancement returned an empty response.",
        )
    return enhanced


async def translate_to_english(prompt: str) -> str:
    """Translate a non-English prompt to natural English.

    Used as a silent pre-step before sending to gpt-image-1, which performs
    noticeably better in English. The user's original prompt is still preserved
    in the DB.
    """
    client = get_openai_client()

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": TRANSLATE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt.strip()},
            ],
            temperature=0.2,
            max_tokens=800,
        )
    except OpenAIError as exc:
        # Translation is a nice-to-have, not a hard requirement.
        # If it fails, fall back to the original prompt.
        logger.warning("Translation failed, falling back to original: %s", exc)
        return prompt

    translated = (response.choices[0].message.content or "").strip()
    return translated or prompt
