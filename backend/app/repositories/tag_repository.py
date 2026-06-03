from __future__ import annotations

import re

from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Image, Tag, image_tags

_TAG_NORMALIZE = re.compile(r"[^a-z0-9؀-ۿ_-]+")


def normalize_tag(raw: str) -> str:
    s = raw.strip().lower()
    s = _TAG_NORMALIZE.sub("-", s).strip("-")
    return s[:40]


class TagRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_or_create(self, name: str) -> Tag:
        normalized = normalize_tag(name)
        if not normalized:
            raise ValueError("Empty tag after normalization")
        existing = await self.db.scalar(select(Tag).where(Tag.name == normalized))
        if existing:
            return existing
        tag = Tag(name=normalized)
        self.db.add(tag)
        await self.db.flush()
        return tag

    async def assign_to_image(self, image: Image, names: list[str]) -> list[Tag]:
        wanted_names = {n for raw in names if (n := normalize_tag(raw))}

        # Resolve / create every name.
        new_tags: list[Tag] = []
        for n in wanted_names:
            new_tags.append(await self.get_or_create(n))

        image.tags = new_tags
        await self.db.commit()
        await self.db.refresh(image)
        return new_tags

    async def list_with_counts(self) -> list[tuple[Tag, int]]:
        result = await self.db.execute(
            select(Tag, func.count(image_tags.c.image_id))
            .outerjoin(image_tags, image_tags.c.tag_id == Tag.id)
            .group_by(Tag.id)
            .order_by(func.count(image_tags.c.image_id).desc(), Tag.name)
        )
        return [(row[0], int(row[1])) for row in result.all()]


def get_tag_repository(db: AsyncSession = Depends(get_db)) -> TagRepository:
    return TagRepository(db)
