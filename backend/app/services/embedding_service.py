"""Text embeddings for "similar prompts" autocomplete (#17).

Vectors are computed via OpenAI's `text-embedding-3-small`, packed as raw
float32 little-endian bytes, and stored in the `images.embedding` column.
Similarity is plain cosine — fine for SQLite at the scale of a personal
gallery (thousands of rows). For production multi-tenant we'd swap in a
vector DB (pgvector, Pinecone, Qdrant), but the interface here is exactly
what those expose.

All failures are caught broadly and logged — embedding is a best-effort
nice-to-have. A failed embedding never blocks an image from being saved.
"""
from __future__ import annotations

import logging

import numpy as np

from app.config import get_settings
from app.services.openai_client import get_openai_client

logger = logging.getLogger(__name__)

# Each float32 = 4 bytes. text-embedding-3-small returns 1536-dim vectors.
_FLOAT32_DTYPE = np.dtype("<f4")


def pack_vector(vector: list[float]) -> bytes:
    return np.asarray(vector, dtype=_FLOAT32_DTYPE).tobytes()


def unpack_vector(blob: bytes) -> np.ndarray:
    return np.frombuffer(blob, dtype=_FLOAT32_DTYPE)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    na = float(np.linalg.norm(a))
    nb = float(np.linalg.norm(b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


async def embed_text(text: str) -> list[float] | None:
    """Return a 1536-dim vector, or None if embeddings are disabled/failed."""
    settings = get_settings()
    if not settings.embeddings_enabled:
        return None
    if not text.strip():
        return None

    client = get_openai_client()
    try:
        response = await client.embeddings.create(
            model=settings.embedding_model,
            input=text.strip(),
        )
    except Exception as exc:  # noqa: BLE001 — best-effort, never blocks the request
        logger.warning("Embedding call failed; storing record without vector: %s", exc)
        return None

    return list(response.data[0].embedding)
