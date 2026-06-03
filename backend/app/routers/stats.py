"""Cost / usage dashboard (#18)."""
from __future__ import annotations

from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Image
from app.schemas import CostByDay, StatsResponse

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats", response_model=StatsResponse)
async def stats(db: AsyncSession = Depends(get_db)) -> StatsResponse:
    # Lightweight on small galleries (a single SELECT pulls everything).
    result = await db.scalars(select(Image))
    images = result.all()

    total_cost = round(sum(img.cost_usd or 0.0 for img in images), 4)
    translated = sum(1 for img in images if img.was_translated)
    # "cached" here means deduped — a row whose prompt_hash matches another's.
    seen_hashes: dict[str, int] = defaultdict(int)
    for img in images:
        seen_hashes[img.prompt_hash] += 1
    cached_count = sum(count - 1 for count in seen_hashes.values() if count > 1)

    by_quality: dict[str, int] = defaultdict(int)
    by_size: dict[str, int] = defaultdict(int)
    by_day_acc: dict[date, dict[str, float]] = defaultdict(lambda: {"images": 0, "cost_usd": 0.0})

    for img in images:
        by_quality[img.quality] += 1
        by_size[img.size] += 1
        d = img.created_at.date()
        by_day_acc[d]["images"] += 1
        by_day_acc[d]["cost_usd"] += img.cost_usd or 0.0

    by_day = [
        CostByDay(day=d.isoformat(), images=int(v["images"]), cost_usd=round(v["cost_usd"], 4))
        for d, v in sorted(by_day_acc.items())
    ]

    return StatsResponse(
        total_images=len(images),
        total_cost_usd=total_cost,
        cached_count=cached_count,
        translated_count=translated,
        by_quality=dict(by_quality),
        by_size=dict(by_size),
        by_day=by_day,
    )


@router.get("/stats/_count", include_in_schema=False)
async def _count_only(db: AsyncSession = Depends(get_db)) -> dict[str, int]:
    """Tiny endpoint used by the dashboard refresh button to detect new rows."""
    total = await db.scalar(select(func.count()).select_from(Image)) or 0
    return {"total": int(total)}
