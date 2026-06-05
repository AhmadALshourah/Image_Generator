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
import math
import struct

from app.config import get_settings
from app.services.openai_client import get_openai_client

logger = logging.getLogger(__name__)

# Each float32 = 4 bytes (little-endian). text-embedding-3-small: 1536 dims.
_FLOAT32_FMT = "<f"
_FLOAT32_SIZE = struct.calcsize(_FLOAT32_FMT)


def pack_vector(vector: list[float]) -> bytes:
    """Serialize a float list to raw little-endian float32 bytes."""
    return struct.pack(f"<{len(vector)}f", *vector)


def unpack_vector(blob: bytes) -> list[float]:
    """Deserialize raw little-endian float32 bytes to a float list."""
    n = len(blob) // _FLOAT32_SIZE
    return list(struct.unpack(f"<{n}f", blob))


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Pure-Python cosine similarity — no numpy required."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


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
