"""Estimate the USD cost of a single gpt-image-1 generation (#18).

Pricing is approximate (June 2026). The numbers below are deliberately
conservative — they're displayed in a dashboard, not billed to anyone.
"""
from __future__ import annotations

# Base prices per image for a square 1024×1024 (USD).
_BASE_BY_QUALITY: dict[str, float] = {
    "low": 0.011,
    "medium": 0.042,
    "high": 0.167,
    "auto": 0.042,  # gpt-image-1 default is roughly "medium"
}

# Size multipliers vs. 1024×1024.
_SIZE_MULTIPLIER: dict[str, float] = {
    "1024x1024": 1.0,
    "1024x1536": 1.5,
    "1536x1024": 1.5,
    "auto": 1.0,
}


def estimate_image_cost_usd(*, quality: str, size: str) -> float:
    """Return an estimate, rounded to 4 decimals, for a single generation."""
    base = _BASE_BY_QUALITY.get(quality, _BASE_BY_QUALITY["auto"])
    mult = _SIZE_MULTIPLIER.get(size, 1.0)
    return round(base * mult, 4)
