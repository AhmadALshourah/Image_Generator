"""Similar-prompts endpoint (#17).

Computes cosine similarity between the user's query embedding and every
stored image's embedding. Returns the top-N most similar prompts (with their
thumbnails) so the UI can show "you might mean..." suggestions.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

import numpy as np

from app.repositories import ImageRepository, get_image_repository
from app.schemas import SimilarPromptResult, SimilarPromptsResponse
from app.services import embedding_service
from app.storage.factory import get_storage_backend

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


@router.get("/similar", response_model=SimilarPromptsResponse)
async def similar_prompts(
    q: str = Query(..., min_length=2, max_length=2000),
    top_k: int = Query(default=3, ge=1, le=10),
    images: ImageRepository = Depends(get_image_repository),
) -> SimilarPromptsResponse:
    query_vec = await embedding_service.embed_text(q)
    if query_vec is None:
        return SimilarPromptsResponse(query=q, items=[])

    qv = np.asarray(query_vec, dtype="float32")
    qn = float(np.linalg.norm(qv))
    if qn == 0.0:
        return SimilarPromptsResponse(query=q, items=[])

    candidates = await images.all_with_embeddings()
    scored: list[tuple[float, object]] = []
    for img in candidates:
        if not img.embedding:
            continue
        v = embedding_service.unpack_vector(img.embedding)
        nv = float(np.linalg.norm(v))
        if nv == 0.0:
            continue
        score = float(np.dot(qv, v) / (qn * nv))
        scored.append((score, img))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    top = scored[:top_k]

    storage = get_storage_backend()
    items = [
        SimilarPromptResult(
            id=img.id,
            prompt=img.prompt,
            effective_prompt=img.effective_prompt,
            score=round(score, 4),
            thumbnail_url=(
                storage.public_url(img.thumbnail_filename)
                if img.thumbnail_filename
                else storage.public_url(img.filename)
            ),
        )
        for score, img in top
        if score > 0.55  # filter weak matches
    ]

    return SimilarPromptsResponse(query=q, items=items)
