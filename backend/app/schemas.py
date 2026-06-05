from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ImageSize = Literal["1024x1024", "1024x1536", "1536x1024", "auto"]
ImageQuality = Literal["low", "medium", "high", "auto"]
ImageBackground = Literal["transparent", "opaque", "auto"]
ImageOutputFormat = Literal["png", "jpeg", "webp"]


# ---- Image generation -----------------------------------------------------

class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=4000)
    size: ImageSize = "1024x1024"
    quality: ImageQuality = "auto"
    background: ImageBackground = "auto"
    output_format: ImageOutputFormat = "png"
    force: bool = False


class TagSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class ImageRecord(BaseModel):
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
    cost_usd: float
    created_at: datetime
    tags: list[TagSummary] = Field(default_factory=list)
    image_url: str = ""
    thumbnail_url: str = ""
    cached: bool = False
    # Gallery / Library ownership fields
    is_gallery: bool = False
    owner_id: int | None = None

    @classmethod
    def from_orm_with_urls(
        cls,
        image,
        cached: bool = False,
    ) -> "ImageRecord":
        from app.storage.factory import get_storage_backend

        storage = get_storage_backend()
        record = cls.model_validate(image)
        record.image_url = storage.public_url(image.filename)
        record.thumbnail_url = (
            storage.public_url(image.thumbnail_filename)
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


# ---- Prompt enhancement ---------------------------------------------------

class EnhancePromptRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=2000)


class EnhancePromptResponse(BaseModel):
    original: str
    enhanced: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---- Similar prompts (#17) ------------------------------------------------

class SimilarPromptResult(BaseModel):
    id: int
    prompt: str
    effective_prompt: str
    score: float
    thumbnail_url: str


class SimilarPromptsResponse(BaseModel):
    query: str
    items: list[SimilarPromptResult]


# ---- Tags (#20) -----------------------------------------------------------

class TagAssignment(BaseModel):
    tags: list[str] = Field(..., max_length=20)


class TagWithCount(BaseModel):
    id: int
    name: str
    image_count: int


class TagListResponse(BaseModel):
    items: list[TagWithCount]


# ---- Stats / Cost dashboard (#18) -----------------------------------------

class CostByDay(BaseModel):
    day: str  # ISO date
    images: int
    cost_usd: float


class StatsResponse(BaseModel):
    total_images: int
    total_cost_usd: float
    cached_count: int
    translated_count: int
    by_quality: dict[str, int]
    by_size: dict[str, int]
    by_day: list[CostByDay]


# ---- Auth (#14) -----------------------------------------------------------

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int  # seconds


class AuthStatusResponse(BaseModel):
    auth_enabled: bool
    is_authenticated: bool
    username: str | None = None
    needs_setup: bool = False
    role: str = "user"  # 'admin' | 'user'


# ---- Misc -----------------------------------------------------------------

class DeleteResponse(BaseModel):
    deleted: bool
    id: int


class HealthResponse(BaseModel):
    status: str = "ok"
    model: str = "gpt-image-1"
