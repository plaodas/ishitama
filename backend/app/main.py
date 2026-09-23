from __future__ import annotations

import asyncio
import os
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.responses import Response

from app.api.auth import router as auth_router
from app.api.stone import router as stone_router
from app.services.cors import cors_origins
from app.services.depth import load_estimator
from app.services.memory import trim_idle_rss
from app.services.ollama import warm_model

_ORIGIN_GUARDED = {
    ("POST", "/api/auth/login"),
    ("POST", "/api/auth/logout"),
    ("POST", "/api/stone/analyze"),
}


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    load_estimator()
    await asyncio.to_thread(warm_model)
    trim_idle_rss()
    yield


_docs_enabled = os.getenv("ENABLE_DOCS") == "1"
app = FastAPI(
    title="Spirit of Stone",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)


@app.middleware("http")
async def guard_origin(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    if (request.method, request.url.path) in _ORIGIN_GUARDED:
        origin = request.headers.get("origin")
        if origin not in cors_origins():
            return JSONResponse(status_code=403, content={"detail": "forbidden origin"})
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(stone_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
