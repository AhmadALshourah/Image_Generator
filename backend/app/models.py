from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
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


# Association table for many-to-many between Image and Tag.
image_tags = Table(
    "image_tags",
    Base.metadata,
    Column("image_id", ForeignKey("images.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(254), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(128), nullable=False)
    # 'admin' can manage the public Gallery; 'user' has a private Library.
    role: Mapped[str] = mapped_column(String(16), nullable=False, default="user")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    images: Mapped[list["Image"]] = relationship(
        "Image", back_populates="owner", foreign_keys="Image.owner_id"
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

    cost_usd: Mapped[float] = mapped_column(default=0.0, nullable=False)

    embedding: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)

    # True  → lives in the public Gallery (Mordax/admin content).
    # False → lives in the generating user's private Library.
    is_gallery: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    # FK to the user who generated this image. NULL for legacy seed images.
    owner_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False, index=True
    )

    owner: Mapped["User | None"] = relationship(
        "User", back_populates="images", foreign_keys=[owner_id]
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
