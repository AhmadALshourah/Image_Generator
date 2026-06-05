"""Image generation, listing, retrieval, deletion.

Two contexts:
  Gallery  — public, curated by admin (Mordax). is_gallery=True.
  Library  — private per-user. is_gallery=False, owner_id=user.id.

Generate → admin images go to Gallery; user images go to Library.
Delete   → admin can delete anything; users can only delete their own Library images.
"""
from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sse_starlette.sse import EventSourceResponse

from app.limiter import generate_rate_limit, limiter
from app.models import Image
from app.repositories import ImageRepository, get_image_repository
from app.schemas import (
    DeleteResponse,
    GenerateRequest,
    HealthResponse,
    ImageListResponse,
    ImageRecord,
)
from app.services import (
    auth_service,
    cache_service,
    cost_service,
    embedding_service,
    gpt_image_service,
    moderation_service,
    prompt_service,
    storage_service,
)
from app.services.gpt_image_service import StreamCompleted, StreamPartial

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["images"])


# ── helpers ─────────────────────────────────────────────────────────────────

@dataclass
class _ResolvedPrompt:
    effective_prompt: str
    was_translated: bool


async def _moderate_and_translate(body: GenerateRequest) -> _ResolvedPrompt:
    await moderation_service.assert_prompt_allowed(body.prompt)
    if not prompt_service.looks_arabic(body.prompt):
        return _ResolvedPrompt(effective_prompt=body.prompt, was_translated=False)
    translated = await prompt_service.translate_to_english(body.prompt)
    if translated and translated.strip() != body.prompt.strip():
        return _ResolvedPrompt(effective_prompt=translated, was_translated=True)
    return _ResolvedPrompt(effective_prompt=body.prompt, was_translated=False)


async def _get_owner_info(username: str):
    """Return (user_id, role) for the authenticated user."""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        user = await auth_service.get_user(db, username)
        if user is None:
            return None, "user"
        return user.id, user.role


async def _persist(
    *,
    body: GenerateRequest,
    resolved: _ResolvedPrompt,
    image_bytes: bytes,
    output_format: str,
    prompt_hash: str,
    owner_id: int | None,
    is_gallery: bool,
    repo: ImageRepository,
) -> Image:
    image_uuid, filename, thumbnail_filename, file_size = (
        await storage_service.save_image_with_thumbnail(
            image_bytes=image_bytes,
            output_format=output_format,
            metadata={
                "prompt": body.prompt,
                "effective_prompt": resolved.effective_prompt,
                "was_translated": str(resolved.was_translated).lower(),
                "size": body.size,
                "quality": body.quality,
                "background": body.background,
                "model": "gpt-image-1",
            },
        )
    )

    vector = await embedding_service.embed_text(resolved.effective_prompt)
    embedding_blob = embedding_service.pack_vector(vector) if vector else None
    cost = cost_service.estimate_image_cost_usd(quality=body.quality, size=body.size)

    image = Image(
        uuid=image_uuid,
        prompt=body.prompt,
        effective_prompt=resolved.effective_prompt,
        was_translated=resolved.was_translated,
        size=body.size,
        quality=body.quality,
        background=body.background,
        output_format=output_format,
        prompt_hash=prompt_hash,
        filename=filename,
        thumbnail_filename=thumbnail_filename,
        file_size=file_size,
        cost_usd=cost,
        embedding=embedding_blob,
        owner_id=owner_id,
        is_gallery=is_gallery,
    )

    try:
        return await repo.add(image)
    except Exception:
        await repo.rollback()
        await storage_service.delete_files(filename, thumbnail_filename)
        logger.exception("Failed to persist image record")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save image record.",
        )


# ── routes ───────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


@router.post("/generate", response_model=ImageRecord, status_code=status.HTTP_201_CREATED)
@limiter.limit(generate_rate_limit)
async def generate(
    request: Request,
    body: GenerateRequest,
    repo: ImageRepository = Depends(get_image_repository),
    current_user: str = Depends(auth_service.require_owner),
) -> ImageRecord:
    resolved = await _moderate_and_translate(body)

    prompt_hash = cache_service.compute_prompt_hash(
        effective_prompt=resolved.effective_prompt,
        size=body.size,
        quality=body.quality,
        background=body.background,
        output_format=body.output_format,
    )

    if not body.force:
        cached = await repo.find_by_prompt_hash(prompt_hash)
        if cached is not None:
            return ImageRecord.from_orm_with_urls(cached, cached=True)

    result = await gpt_image_service.generate_image(body, effective_prompt=resolved.effective_prompt)
    await moderation_service.moderate_image_output(result.image_bytes, result.output_format)

    owner_id, role = await _get_owner_info(current_user)
    is_gallery = (role == "admin")

    image = await _persist(
        body=body, resolved=resolved,
        image_bytes=result.image_bytes, output_format=result.output_format,
        prompt_hash=prompt_hash,
        owner_id=owner_id, is_gallery=is_gallery,
        repo=repo,
    )
    return ImageRecord.from_orm_with_urls(image, cached=False)


@router.post("/generate/stream")
@limiter.limit(generate_rate_limit)
async def generate_stream(
    request: Request,
    body: GenerateRequest,
    repo: ImageRepository = Depends(get_image_repository),
    current_user: str = Depends(auth_service.require_owner),
):
    async def event_generator() -> AsyncIterator[dict[str, Any]]:
        try:
            yield {"event": "stage", "data": json.dumps({"stage": "moderating"})}
            try:
                await moderation_service.assert_prompt_allowed(body.prompt)
            except HTTPException as exc:
                yield {"event": "error", "data": json.dumps({"detail": str(exc.detail)})}
                return

            if prompt_service.looks_arabic(body.prompt):
                yield {"event": "stage", "data": json.dumps({"stage": "translating"})}
                translated = await prompt_service.translate_to_english(body.prompt)
                if translated and translated.strip() != body.prompt.strip():
                    resolved = _ResolvedPrompt(effective_prompt=translated, was_translated=True)
                    yield {"event": "stage", "data": json.dumps({"stage": "translated", "effective_prompt": translated})}
                else:
                    resolved = _ResolvedPrompt(effective_prompt=body.prompt, was_translated=False)
            else:
                resolved = _ResolvedPrompt(effective_prompt=body.prompt, was_translated=False)

            prompt_hash = cache_service.compute_prompt_hash(
                effective_prompt=resolved.effective_prompt,
                size=body.size, quality=body.quality,
                background=body.background, output_format=body.output_format,
            )

            if not body.force:
                yield {"event": "stage", "data": json.dumps({"stage": "cache_check"})}
                cached = await repo.find_by_prompt_hash(prompt_hash)
                if cached is not None:
                    record = ImageRecord.from_orm_with_urls(cached, cached=True)
                    yield {"event": "complete", "data": record.model_dump_json()}
                    return

            yield {"event": "stage", "data": json.dumps({"stage": "generating"})}

            final_bytes: bytes | None = None
            final_format = body.output_format
            try:
                async for piece in gpt_image_service.stream_generate_image(
                    body, effective_prompt=resolved.effective_prompt
                ):
                    if isinstance(piece, StreamPartial):
                        yield {"event": "partial", "data": json.dumps({"index": piece.index, "b64_json": piece.b64_json})}
                    elif isinstance(piece, StreamCompleted):
                        final_bytes = piece.image_bytes
                        final_format = piece.output_format
            except HTTPException as exc:
                yield {"event": "error", "data": json.dumps({"detail": str(exc.detail)})}
                return

            if final_bytes is None:
                yield {"event": "error", "data": json.dumps({"detail": "No final image returned by provider"})}
                return

            try:
                await moderation_service.moderate_image_output(final_bytes, final_format)
            except HTTPException as exc:
                yield {"event": "error", "data": json.dumps({"detail": str(exc.detail)})}
                return

            owner_id, role = await _get_owner_info(current_user)
            is_gallery = (role == "admin")

            yield {"event": "stage", "data": json.dumps({"stage": "saving"})}
            try:
                image = await _persist(
                    body=body, resolved=resolved,
                    image_bytes=final_bytes, output_format=final_format,
                    prompt_hash=prompt_hash,
                    owner_id=owner_id, is_gallery=is_gallery,
                    repo=repo,
                )
            except HTTPException as exc:
                yield {"event": "error", "data": json.dumps({"detail": str(exc.detail)})}
                return

            record = ImageRecord.from_orm_with_urls(image, cached=False)
            yield {"event": "complete", "data": record.model_dump_json()}

        except Exception as exc:
            logger.exception("Unhandled error during streaming generation")
            yield {"event": "error", "data": json.dumps({"detail": f"Unexpected: {exc}"})}

    return EventSourceResponse(event_generator())


# ── Gallery (public, is_gallery=True) ────────────────────────────────────────

@router.get("/images", response_model=ImageListResponse)
async def list_gallery(
    limit: int = Query(default=12, ge=1, le=60),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, max_length=200),
    size: str | None = Query(default=None),
    quality: str | None = Query(default=None),
    background: str | None = Query(default=None),
    tag: str | None = Query(default=None, max_length=40),
    repo: ImageRepository = Depends(get_image_repository),
) -> ImageListResponse:
    images, total = await repo.list_filtered(
        limit=limit, offset=offset,
        q=q, size=size, quality=quality, background=background, tag=tag,
    )
    return ImageListResponse(
        items=[ImageRecord.from_orm_with_urls(img) for img in images],
        total=total, limit=limit, offset=offset,
    )


# ── Library (private, per-user) ──────────────────────────────────────────────

@router.get("/library", response_model=ImageListResponse)
async def list_library(
    limit: int = Query(default=12, ge=1, le=60),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, max_length=200),
    size: str | None = Query(default=None),
    quality: str | None = Query(default=None),
    background: str | None = Query(default=None),
    tag: str | None = Query(default=None, max_length=40),
    repo: ImageRepository = Depends(get_image_repository),
    current_user: str = Depends(auth_service.require_owner),
) -> ImageListResponse:
    owner_id, _role = await _get_owner_info(current_user)
    if owner_id is None:
        return ImageListResponse(items=[], total=0, limit=limit, offset=offset)

    images, total = await repo.list_library(
        owner_id=owner_id,
        limit=limit, offset=offset,
        q=q, size=size, quality=quality, background=background, tag=tag,
    )
    return ImageListResponse(
        items=[ImageRecord.from_orm_with_urls(img) for img in images],
        total=total, limit=limit, offset=offset,
    )


# ── Single image ─────────────────────────────────────────────────────────────

@router.get("/images/{image_id}", response_model=ImageRecord)
async def get_image(
    image_id: int,
    repo: ImageRepository = Depends(get_image_repository),
) -> ImageRecord:
    image = await repo.get_by_id(image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return ImageRecord.from_orm_with_urls(image)


@router.delete("/images/{image_id}", response_model=DeleteResponse)
async def delete_image(
    image_id: int,
    repo: ImageRepository = Depends(get_image_repository),
    current_user: str = Depends(auth_service.require_owner),
) -> DeleteResponse:
    image = await repo.get_by_id(image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    owner_id, role = await _get_owner_info(current_user)

    # Admin can delete anything; regular users can only delete their own library images.
    is_admin = role == "admin"
    owns_image = image.owner_id == owner_id and not image.is_gallery

    if not is_admin and not owns_image:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own Library images.",
        )

    filename = image.filename
    thumbnail_filename = image.thumbnail_filename
    await repo.delete(image)
    await storage_service.delete_files(filename, thumbnail_filename)

    return DeleteResponse(deleted=True, id=image_id)
