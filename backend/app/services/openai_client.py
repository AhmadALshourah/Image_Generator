"""Shared AsyncOpenAI client.

A single instance is created lazily and reused for the lifetime of the app,
so its internal httpx connection pool is shared across all requests.
"""
from functools import lru_cache

from openai import AsyncOpenAI

from app.config import get_settings


@lru_cache(maxsize=1)
def get_openai_client() -> AsyncOpenAI:
    settings = get_settings()
    return AsyncOpenAI(api_key=settings.openai_api_key)
