from __future__ import annotations

import asyncio
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.stone import StoneAnalysis
from app.services.analyze import analyze_image
from app.services.depth import get_estimator

router = APIRouter()

MAX_BYTES = 8 * 1024 * 1024
ALLOWED_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/octet-stream",
    "",
    None,
}


@router.post("/api/stone/analyze", response_model=StoneAnalysis)
async def analyze_stone(image: Annotated[UploadFile, File()]) -> StoneAnalysis:
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="jpg/png only")

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty image")
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="too large")

    try:
        estimator = get_estimator()
        return await asyncio.to_thread(analyze_image, raw, estimator)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        del raw
