from __future__ import annotations

from collections.abc import Iterable

from fastapi import Depends
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Image, Tag, image_tags


class ImageRepository:
    """All Image-related queries. The routing layer is SQLAlchemy-free."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── writes ─────────────────────────────────────────────────────────────

    async def add(self, image: Image) -> Image:
        self.db.add(image)
        await self.db.commit()
        await self.db.refresh(image)
        return image

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def delete(self, image: Image) -> None:
        await self.db.delete(image)
        await self.db.commit()

    # ── reads ───────────────────────────────────────────────────────────────

    async def get_by_id(self, image_id: int) -> Image | None:
        return await self.db.get(Image, image_id)

    async def find_by_prompt_hash(self, prompt_hash: str) -> Image | None:
        return await self.db.scalar(
            select(Image).where(Image.prompt_hash == prompt_hash).limit(1)
        )

    def _base_conditions(
        self,
        q: str | None,
        size: str | None,
        quality: str | None,
        background: str | None,
    ):
        """Build shared WHERE conditions for text/meta filters."""
        conditions = []
        if q:
            like = f"%{q.strip().lower()}%"
            conditions.append(
                or_(
                    func.lower(Image.prompt).like(like),
                    func.lower(Image.effective_prompt).like(like),
                )
            )
        if size:
            conditions.append(Image.size == size)
        if quality:
            conditions.append(Image.quality == quality)
        if background:
            conditions.append(Image.background == background)
        return conditions

    async def list_filtered(
        self,
        *,
        limit: int,
        offset: int,
        q: str | None = None,
        size: str | None = None,
        quality: str | None = None,
        background: str | None = None,
        tag: str | None = None,
    ) -> tuple[list[Image], int]:
        """Public Gallery: returns only is_gallery=True images."""
        conditions = self._base_conditions(q, size, quality, background)
        conditions.append(Image.is_gallery == True)  # noqa: E712

        where_clause = and_(*conditions) if conditions else None

        count_stmt = select(func.count(Image.id.distinct()))
        list_stmt = select(Image)

        if tag:
            count_stmt = count_stmt.select_from(Image).join(image_tags).join(Tag).where(
                Tag.name == tag.strip().lower()
            )
            list_stmt = list_stmt.join(image_tags).join(Tag).where(
                Tag.name == tag.strip().lower()
            )
        else:
            count_stmt = count_stmt.select_from(Image)

        if where_clause is not None:
            count_stmt = count_stmt.where(where_clause)
            list_stmt = list_stmt.where(where_clause)

        total = await self.db.scalar(count_stmt) or 0
        list_stmt = list_stmt.order_by(desc(Image.created_at)).limit(limit).offset(offset)
        result = await self.db.scalars(list_stmt)
        return list(result.all()), int(total)

    async def list_library(
        self,
        *,
        owner_id: int,
        limit: int,
        offset: int,
        q: str | None = None,
        size: str | None = None,
        quality: str | None = None,
        background: str | None = None,
        tag: str | None = None,
    ) -> tuple[list[Image], int]:
        """Private Library: returns only images owned by owner_id where is_gallery=False."""
        conditions = self._base_conditions(q, size, quality, background)
        conditions.append(Image.owner_id == owner_id)
        conditions.append(Image.is_gallery == False)  # noqa: E712

        where_clause = and_(*conditions)

        count_stmt = select(func.count(Image.id.distinct()))
        list_stmt = select(Image)

        if tag:
            count_stmt = count_stmt.select_from(Image).join(image_tags).join(Tag).where(
                Tag.name == tag.strip().lower()
            )
            list_stmt = list_stmt.join(image_tags).join(Tag).where(
                Tag.name == tag.strip().lower()
            )
        else:
            count_stmt = count_stmt.select_from(Image)

        count_stmt = count_stmt.where(where_clause)
        list_stmt = list_stmt.where(where_clause)

        total = await self.db.scalar(count_stmt) or 0
        list_stmt = list_stmt.order_by(desc(Image.created_at)).limit(limit).offset(offset)
        result = await self.db.scalars(list_stmt)
        return list(result.all()), int(total)

    async def all_with_embeddings(self) -> Iterable[Image]:
        result = await self.db.scalars(select(Image).where(Image.embedding.isnot(None)))
        return result.all()


def get_image_repository(db: AsyncSession = Depends(get_db)) -> ImageRepository:
    return ImageRepository(db)
