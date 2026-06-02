"""Deterministic prompt cache.

Hash the canonical generation inputs; if a record with that hash exists we
short-circuit and return the cached image instead of paying for a new one.
"""
import hashlib


def compute_prompt_hash(
    *,
    effective_prompt: str,
    size: str,
    quality: str,
    background: str,
    output_format: str,
) -> str:
    """SHA-256 of the canonicalized generation inputs.

    Canonicalization rules (so that "Cat" / "cat " / "CAT" map to the same hash):
      - strip whitespace
      - lowercase
      - join with `|` as field separator
    """
    canonical = "|".join(
        [
            effective_prompt.strip().lower(),
            size,
            quality,
            background,
            output_format,
        ]
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
