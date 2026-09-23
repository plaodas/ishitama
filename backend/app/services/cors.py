from __future__ import annotations

import os

_DEFAULT_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"


def cors_origins() -> list[str]:
    raw = os.getenv("BACKEND_CORS_ORIGINS", _DEFAULT_ORIGINS)
    return [origin.strip() for origin in raw.split(",") if origin.strip()]
