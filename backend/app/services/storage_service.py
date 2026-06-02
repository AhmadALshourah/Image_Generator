"""Local-disk storage for generated images.

Each image is persisted as two files:
  * `{uuid}.{ext}`           - the full-resolution original from gpt-image-1
  * `{uuid}-thumb.webp`      - a small (384px) WebP thumbnail used by the gallery grid

Thumbnails reduce gallery bandwidth by ~95% (from ~1.5 MB PNG to ~25 KB WebP).
"""
import asyncio
import io
import logging
import uuid
from pathlib import Path

import aiofiles
from PIL import Image

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
IMAGES_DIR = BASE_DIR / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

THUMBNAIL_MAX_SIZE = 384  # longest edge in pixels
THUMBNAIL_QUALITY = 78


def _make_thumbnail_bytes(image_bytes: bytes) -> bytes:
    """CPU-bound: generate a WebP thumbnail. Run inside `to_thread`."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        img = img.convert("RGBA") if img.mode in ("P", "LA") else img.convert("RGB") if img.mode == "CMYK" else img
        img.thumbnail((THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE), Image.LANCZOS)

        # WebP supports transparency, so we preserve the alpha channel if present.
        out_mode = "RGBA" if img.mode == "RGBA" else "RGB"
        if img.mode != out_mode:
            img = img.convert(out_mode)

        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=THUMBNAIL_QUALITY, method=6)
        return buf.getvalue()


async def save_image_with_thumbnail(
    image_bytes: bytes,
    output_format: str,
) -> tuple[str, str, str, int]:
    """Persist the full image AND generate a WebP thumbnail in parallel.

    Returns: (uuid, filename, thumbnail_filename, file_size_bytes)
    """
    image_uuid = str(uuid.uuid4())
    ext = {"png": "png", "jpeg": "jpg", "webp": "webp"}.get(output_format, "png")
    filename = f"{image_uuid}.{ext}"
    thumbnail_filename = f"{image_uuid}-thumb.webp"

    full_path = IMAGES_DIR / filename
    thumb_path = IMAGES_DIR / thumbnail_filename

    # Generate the thumbnail off the event loop (Pillow is CPU-bound).
    thumb_task = asyncio.create_task(asyncio.to_thread(_make_thumbnail_bytes, image_bytes))

    async with aiofiles.open(full_path, "wb") as f:
        await f.write(image_bytes)

    try:
        thumbnail_bytes = await thumb_task
        async with aiofiles.open(thumb_path, "wb") as f:
            await f.write(thumbnail_bytes)
    except Exception:
        logger.exception("Thumbnail generation failed for %s; continuing without it", filename)
        thumbnail_filename = ""

    file_size = full_path.stat().st_size
    return image_uuid, filename, thumbnail_filename, file_size


async def delete_files(filename: str, thumbnail_filename: str = "") -> None:
    for name in filter(None, (filename, thumbnail_filename)):
        path = IMAGES_DIR / name
        try:
            await asyncio.to_thread(path.unlink, missing_ok=True)
        except OSError:
            logger.warning("Failed to delete %s", name)


def get_file_path(filename: str) -> Path:
    return IMAGES_DIR / filename
