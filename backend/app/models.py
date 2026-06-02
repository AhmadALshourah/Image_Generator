from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Image(Base):
    __tablename__ = "images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False)

    # The prompt as the user typed it (original language).
    prompt: Mapped[str] = mapped_column(Text, nullable=False)

    # What was actually sent to the model (translated to English when needed).
    effective_prompt: Mapped[str] = mapped_column(Text, nullable=False)

    # Whether the original prompt was translated before generation.
    was_translated: Mapped[bool] = mapped_column(default=False, nullable=False)

    # gpt-image-1 generation parameters.
    size: Mapped[str] = mapped_column(String(16), nullable=False)
    quality: Mapped[str] = mapped_column(String(16), nullable=False)
    background: Mapped[str] = mapped_column(String(16), nullable=False)
    output_format: Mapped[str] = mapped_column(String(8), nullable=False, default="png")

    # Cache key for de-duplication: SHA-256 of (effective_prompt + size + quality + background).
    prompt_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    # File storage.
    filename: Mapped[str] = mapped_column(String(128), nullable=False)
    thumbnail_filename: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    file_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False, index=True
    )
