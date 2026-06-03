from __future__ import annotations

import asyncio
import logging
from pathlib import Path

import aiofiles

logger = logging.getLogger(__name__)


class LocalDiskStorage:
    """Writes objects to a local directory. Served by FastAPI's StaticFiles."""

    def __init__(self, directory: Path, public_url_prefix: str = "/api/images/files") -> None:
        self.directory = directory
        self.public_url_prefix = public_url_prefix.rstrip("/")
        self.directory.mkdir(parents=True, exist_ok=True)

    async def save(self, filename: str, content: bytes, content_type: str) -> None:
        target = self.directory / filename
        async with aiofiles.open(target, "wb") as f:
            await f.write(content)

    async def delete(self, filename: str) -> None:
        if not filename:
            return
        target = self.directory / filename
        try:
            await asyncio.to_thread(target.unlink, missing_ok=True)
        except OSError:
            logger.warning("Failed to delete local file: %s", filename)

    def public_url(self, filename: str) -> str:
        return f"{self.public_url_prefix}/{filename}"
