from __future__ import annotations

from fastapi import HTTPException, Request

from app.services.cookie import SESSION_COOKIE
from app.services.session import session_exists


def _session_token(request: Request) -> str | None:
    token = request.cookies.get(SESSION_COOKIE)
    if token is None or not session_exists(token):
        return None
    return token


def require_session(request: Request) -> str:
    token = _session_token(request)
    if token is None:
        raise HTTPException(status_code=401, detail="unauthorized")
    return token


def optional_session(request: Request) -> str | None:
    return _session_token(request)
