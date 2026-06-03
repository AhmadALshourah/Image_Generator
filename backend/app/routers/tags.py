"""Tag management endpoints (#20)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.repositories import ImageRepository, TagRepository, get_image_repository, get_tag_repository
from app.schemas import (
    ImageRecord,
    TagAssignment,
    TagListResponse,
    TagWithCount,
)
from app.services import auth_service

router = APIRouter(prefix="/api", tags=["tags"])


@router.get("/tags", response_model=TagListResponse)
async def list_tags(repo: TagRepository = Depends(get_tag_repository)) -> TagListResponse:
    pairs = await repo.list_with_counts()
    return TagListResponse(
        items=[TagWithCount(id=t.id, name=t.name, image_count=count) for t, count in pairs]
    )


@router.put("/images/{image_id}/tags", response_model=ImageRecord)
async def set_image_tags(
    image_id: int,
    payload: TagAssignment,
    images: ImageRepository = Depends(get_image_repository),
    tags: TagRepository = Depends(get_tag_repository),
    _: str = Depends(auth_service.require_owner),
) -> ImageRecord:
    image = await images.get_by_id(image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    await tags.assign_to_image(image, payload.tags)
    return ImageRecord.from_orm_with_urls(image)
