from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# Association table for many-to-many between Image and Tag (#20).
image_tags = Table(
    "image_tags",
    Base.metadata,
    Column("image_id", ForeignKey("images.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Image(Base):
    __tablename__ = "images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False)

    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    effective_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    was_translated: Mapped[bool] = mapped_column(default=False, nullable=False)

    size: Mapped[str] = mapped_column(String(16), nullable=False)
    quality: Mapped[str] = mapped_column(String(16), nullable=False)
    background: Mapped[str] = mapped_column(String(16), nullable=False)
    output_format: Mapped[str] = mapped_column(String(8), nullable=False, default="png")

    prompt_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    filename: Mapped[str] = mapped_column(String(128), nullable=False)
    thumbnail_filename: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    file_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Estimated USD cost for this generation (#18).
    cost_usd: Mapped[float] = mapped_column(default=0.0, nullable=False)

    # Packed float32 vector for the effective_prompt (#17).
    embedding: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False, index=True
    )

    tags: Mapped[list["Tag"]] = relationship(
        secondary=image_tags, back_populates="images", lazy="selectin"
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    images: Mapped[list[Image]] = relationship(
        secondary=image_tags, back_populates="tags"
    )
