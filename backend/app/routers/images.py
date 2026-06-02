"""Image generation, listing, retrieval, deletion.

The `POST /api/generate` pipeline:
  1. Moderate the prompt (OpenAI Moderation API).
  2. Detect Arabic → translate to English via GPT-4o-mini.
  3. Compute the cache hash from the effective (English) prompt + options.
  4. If an identical record already exists (and `force=false`), return it.
  5. Otherwise call gpt-image-1, persist the image + WebP thumbnail, store the row.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Image
from app.schemas import (
    DeleteResponse,
    GenerateRequest,
    HealthResponse,
    ImageListResponse,
    ImageRecord,
)
from app.services import (
    cache_service,
    gpt_image_service,
    moderation_service,
    prompt_service,
    storage_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["images"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


@router.post("/generate", response_model=ImageRecord, status_code=status.HTTP_201_CREATED)
async def generate(request: GenerateRequest, db: AsyncSession = Depends(get_db)) -> ImageRecord:
    # 1. Moderation pre-flight (free, fast, blocks TOS-violating prompts).
    await moderation_service.assert_prompt_allowed(request.prompt)

    # 2. Detect Arabic and translate to English silently.
    was_translated = False
    effective_prompt = request.prompt
    if prompt_service.looks_arabic(request.prompt):
        translated = await prompt_service.translate_to_english(request.prompt)
        if translated and translated.strip() != request.prompt.strip():
            effective_prompt = translated
            was_translated = True

    # 3. Cache lookup.
    prompt_hash = cache_service.compute_prompt_hash(
        effective_prompt=effective_prompt,
        size=request.size,
        quality=request.quality,
        background=request.background,
        output_format=request.output_format,
    )

    if not request.force:
        cached = await db.scalar(
            select(Image).where(Image.prompt_hash == prompt_hash).limit(1)
        )
        if cached is not None:
            return ImageRecord.from_orm_with_urls(cached, cached=True)

    # 4. Generate with gpt-image-1.
    result = await gpt_image_service.generate_image(request, effective_prompt=effective_prompt)

    # 5. Persist file + WebP thumbnail.
    image_uuid, filename, thumbnail_filename, file_size = (
        await storage_service.save_image_with_thumbnail(result.image_bytes, result.output_format)
    )

    image = Image(
        uuid=image_uuid,
        prompt=request.prompt,
        effective_prompt=effective_prompt,
        was_translated=was_translated,
        size=request.size,
        quality=request.quality,
        background=request.background,
        output_format=result.output_format,
        prompt_hash=prompt_hash,
        filename=filename,
        thumbnail_filename=thumbnail_filename,
        file_size=file_size,
    )

    try:
        db.add(image)
        await db.commit()
        await db.refresh(image)
    except Exception:
        await db.rollback()
        await storage_service.delete_files(filename, thumbnail_filename)
        logger.exception("Failed to persist image record")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save image record.",
        )

    return ImageRecord.from_orm_with_urls(image, cached=False)


@router.get("/images", response_model=ImageListResponse)
async def list_images(
    limit: int = Query(default=12, ge=1, le=60),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> ImageListResponse:
    total = await db.scalar(select(func.count()).select_from(Image)) or 0

    result = await db.scalars(
        select(Image).order_by(desc(Image.created_at)).limit(limit).offset(offset)
    )
    images = result.all()

    return ImageListResponse(
        items=[ImageRecord.from_orm_with_urls(img) for img in images],
        total=int(total),
        limit=limit,
        offset=offset,
    )


@router.get("/images/{image_id}", response_model=ImageRecord)
async def get_image(image_id: int, db: AsyncSession = Depends(get_db)) -> ImageRecord:
    image = await db.get(Image, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return ImageRecord.from_orm_with_urls(image)


@router.delete("/images/{image_id}", response_model=DeleteResponse)
async def delete_image(image_id: int, db: AsyncSession = Depends(get_db)) -> DeleteResponse:
    image = await db.get(Image, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    filename = image.filename
    thumbnail_filename = image.thumbnail_filename
    await db.delete(image)
    await db.commit()
    await storage_service.delete_files(filename, thumbnail_filename)

    return DeleteResponse(deleted=True, id=image_id)
