from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ImageSize = Literal["1024x1024", "1024x1536", "1536x1024", "auto"]
ImageQuality = Literal["low", "medium", "high", "auto"]
ImageBackground = Literal["transparent", "opaque", "auto"]
ImageOutputFormat = Literal["png", "jpeg", "webp"]


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=4000)
    size: ImageSize = "1024x1024"
    quality: ImageQuality = "auto"
    background: ImageBackground = "auto"
    output_format: ImageOutputFormat = "png"
    force: bool = False  # bypass the prompt cache


class ImageRecord(BaseModel):
    """A persisted image record returned to the client."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: str
    prompt: str
    effective_prompt: str
    was_translated: bool
    size: str
    quality: str
    background: str
    output_format: str
    filename: str
    thumbnail_filename: str
    file_size: int
    created_at: datetime
    image_url: str = ""
    thumbnail_url: str = ""
    cached: bool = False

    @classmethod
    def from_orm_with_urls(
        cls,
        image,
        base_path: str = "/api/images/files",
        cached: bool = False,
    ) -> "ImageRecord":
        record = cls.model_validate(image)
        record.image_url = f"{base_path}/{image.filename}"
        record.thumbnail_url = (
            f"{base_path}/{image.thumbnail_filename}"
            if image.thumbnail_filename
            else record.image_url
        )
        record.cached = cached
        return record


class ImageListResponse(BaseModel):
    items: list[ImageRecord]
    total: int
    limit: int
    offset: int


class EnhancePromptRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=2000)


class EnhancePromptResponse(BaseModel):
    original: str
    enhanced: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DeleteResponse(BaseModel):
    deleted: bool
    id: int


class HealthResponse(BaseModel):
    status: str = "ok"
    model: str = "gpt-image-1"
