"""High-level image persistence: original + WebP thumbnail + PNG metadata.

This module orchestrates the pipeline; the actual byte writes flow through
the pluggable `StorageBackend` (local disk or S3-compatible).
"""
from __future__ import annotations

import asyncio
import io
import logging
import uuid
from pathlib import Path

from PIL import Image, PngImagePlugin

from app.config import get_settings
from app.storage import get_storage_backend

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
THUMBNAIL_MAX_SIZE = 384
THUMBNAIL_QUALITY = 78

# Kept for backwards-compat (tests + StaticFiles mount still read this).
def _resolve_images_dir() -> Path:
    settings = get_settings()
    base = Path(settings.data_dir) if settings.data_dir else BASE_DIR
    target = base / "images"
    target.mkdir(parents=True, exist_ok=True)
    return target


IMAGES_DIR = _resolve_images_dir()


_CONTENT_TYPES = {"png": "image/png", "jpeg": "image/jpeg", "webp": "image/webp"}


def _make_thumbnail_bytes(image_bytes: bytes) -> bytes:
    with Image.open(io.BytesIO(image_bytes)) as img:
        if img.mode in ("P", "LA"):
            img = img.convert("RGBA")
        elif img.mode == "CMYK":
            img = img.convert("RGB")

        img.thumbnail((THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE), Image.LANCZOS)

        out_mode = "RGBA" if img.mode == "RGBA" else "RGB"
        if img.mode != out_mode:
            img = img.convert(out_mode)

        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=THUMBNAIL_QUALITY, method=6)
        return buf.getvalue()


def _embed_png_metadata(image_bytes: bytes, metadata: dict[str, str]) -> bytes:
    with Image.open(io.BytesIO(image_bytes)) as img:
        info = PngImagePlugin.PngInfo()
        for key, value in metadata.items():
            if value is None:
                continue
            safe_key = "".join(c for c in str(key) if 32 <= ord(c) < 127)[:79] or "data"
            info.add_text(safe_key, str(value))
        buf = io.BytesIO()
        img.save(buf, format="PNG", pnginfo=info, optimize=False)
        return buf.getvalue()


async def save_image_with_thumbnail(
    *,
    image_bytes: bytes,
    output_format: str,
    metadata: dict[str, str] | None = None,
) -> tuple[str, str, str, int]:
    """Persist original + WebP thumbnail via the active StorageBackend.

    Returns: (uuid, filename, thumbnail_filename, file_size_bytes)
    """
    storage = get_storage_backend()

    image_uuid = str(uuid.uuid4())
    ext = {"png": "png", "jpeg": "jpg", "webp": "webp"}.get(output_format, "png")
    filename = f"{image_uuid}.{ext}"
    thumbnail_filename = f"{image_uuid}-thumb.webp"

    bytes_to_save = image_bytes
    if output_format == "png" and metadata:
        try:
            bytes_to_save = await asyncio.to_thread(_embed_png_metadata, image_bytes, metadata)
        except Exception:
            logger.exception("PNG metadata embedding failed; saving raw bytes")
            bytes_to_save = image_bytes

    # Generate thumbnail in parallel with writing the original.
    thumb_task = asyncio.create_task(asyncio.to_thread(_make_thumbnail_bytes, image_bytes))

    content_type = _CONTENT_TYPES.get(output_format, "application/octet-stream")
    await storage.save(filename, bytes_to_save, content_type)

    file_size = len(bytes_to_save)

    try:
        thumbnail_bytes = await thumb_task
        await storage.save(thumbnail_filename, thumbnail_bytes, "image/webp")
    except Exception:
        logger.exception("Thumbnail generation failed for %s; continuing without it", filename)
        thumbnail_filename = ""

    return image_uuid, filename, thumbnail_filename, file_size


async def delete_files(filename: str, thumbnail_filename: str = "") -> None:
    storage = get_storage_backend()
    for name in filter(None, (filename, thumbnail_filename)):
        await storage.delete(name)


def get_file_path(filename: str) -> Path:
    """Local-disk path. Only meaningful when STORAGE_BACKEND=local."""
    return IMAGES_DIR / filename
