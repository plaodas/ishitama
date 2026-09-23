from __future__ import annotations

import asyncio
import time
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)

from app.api.deps import require_session
from app.schemas.stone import StoneAnalysis
from app.services.analyze import analyze_image
from app.services.client_ip import client_ip
from app.services.depth import get_estimator
from app.services.memory import trim_idle_rss

router = APIRouter()

MAX_BYTES = 8 * 1024 * 1024
CHUNK_SIZE = 64 * 1024
RATE_LIMIT = 10
RATE_WINDOW_SECONDS = 60.0
ALLOWED_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/octet-stream",
    "",
    None,
}

_analyze_slot = asyncio.Semaphore(1)
_hits: dict[str, list[float]] = {}


def _allow_request(ip: str) -> bool:
    now = time.monotonic()
    cutoff = now - RATE_WINDOW_SECONDS
    stale = [key for key, stamps in _hits.items() if not stamps or stamps[-1] <= cutoff]
    for key in stale:
        del _hits[key]
    recent = [stamp for stamp in _hits.get(ip, []) if stamp > cutoff]
    if len(recent) >= RATE_LIMIT:
        _hits[ip] = recent
        return False
    recent.append(now)
    _hits[ip] = recent
    return True


def _try_acquire_slot() -> bool:
    if _analyze_slot.locked():
        return False
    # acquire() yields even when free, so two requests can both pass locked().
    _analyze_slot._value -= 1
    return True


def _release_slot() -> None:
    _analyze_slot.release()


async def _read_limited(upload: UploadFile) -> bytes:
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await upload.read(CHUNK_SIZE)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_BYTES:
            raise HTTPException(status_code=413, detail="too large")
        chunks.append(chunk)
    if total == 0:
        raise HTTPException(status_code=400, detail="empty image")
    return b"".join(chunks)


@router.post("/api/stone/analyze", response_model=StoneAnalysis)
async def analyze_stone(
    request: Request,
    image: Annotated[UploadFile, File()],
    background_tasks: BackgroundTasks,
    _token: Annotated[str, Depends(require_session)],
    hour: Annotated[int | None, Form()] = None,
) -> StoneAnalysis:
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="jpg/png only")
    if not _allow_request(client_ip(request)):
        raise HTTPException(status_code=429, detail="too many requests")

    raw = await _read_limited(image)
    local_hour = hour if hour is not None and 0 <= hour <= 23 else None
    if not _try_acquire_slot():
        raise HTTPException(status_code=503, detail="busy")

    try:
        estimator = get_estimator()
        result = await asyncio.to_thread(analyze_image, raw, estimator, local_hour)
    except ValueError as exc:
        trim_idle_rss()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        _release_slot()
        del raw
    background_tasks.add_task(trim_idle_rss)
    return result
