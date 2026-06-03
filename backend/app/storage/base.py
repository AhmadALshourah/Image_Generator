"""Abstract storage backend.

The image-saving code does not care whether bytes land on local disk, S3,
Cloudflare R2, or MinIO. Implementations of this Protocol provide the
plumbing; selection happens via the `STORAGE_BACKEND` env var.
"""
from __future__ import annotations

from typing import Protocol


class StorageBackend(Protocol):
    """Storage abstraction. All methods are async-safe."""

    async def save(self, filename: str, content: bytes, content_type: str) -> None:
        """Persist `content` under `filename`."""

    async def delete(self, filename: str) -> None:
        """Best-effort delete. Must not raise on missing files."""

    def public_url(self, filename: str) -> str:
        """Return a URL the browser can fetch the object from."""
