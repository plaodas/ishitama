from __future__ import annotations

import hashlib
import hmac
import os
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app.api.deps import optional_session, require_session
from app.schemas.auth import LoginRequest
from app.services.client_ip import client_ip
from app.services.cookie import clear_session_cookie, set_session_cookie
from app.services.session import create_session, revoke_session

router = APIRouter()

LOGIN_LIMIT = 5
LOGIN_WINDOW_SECONDS = 60.0
_hits: dict[str, list[float]] = {}


def _gate_password() -> str | None:
    password = os.getenv("GATE_PASSWORD", "")
    return password if password else None


def _allow_login(ip: str) -> bool:
    now = time.monotonic()
    cutoff = now - LOGIN_WINDOW_SECONDS
    stale = [key for key, stamps in _hits.items() if not stamps or stamps[-1] <= cutoff]
    for key in stale:
        del _hits[key]
    recent = [stamp for stamp in _hits.get(ip, []) if stamp > cutoff]
    if len(recent) >= LOGIN_LIMIT:
        _hits[ip] = recent
        return False
    recent.append(now)
    _hits[ip] = recent
    return True


def _ok() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@router.post("/api/auth/login")
def login(body: LoginRequest, request: Request) -> JSONResponse:
    if not _allow_login(client_ip(request)):
        raise HTTPException(status_code=429, detail="too many requests")
    expected = _gate_password()
    if expected is None:
        raise HTTPException(status_code=503, detail="gate not configured")
    if not hmac.compare_digest(
        hashlib.sha256(body.password.encode("utf-8")).digest(),
        hashlib.sha256(expected.encode("utf-8")).digest(),
    ):
        raise HTTPException(status_code=401, detail="unauthorized")
    response = _ok()
    response.headers.append("set-cookie", set_session_cookie(create_session()))
    return response


@router.post("/api/auth/logout")
def logout(token: Annotated[str | None, Depends(optional_session)]) -> JSONResponse:
    if token is not None:
        revoke_session(token)
    response = _ok()
    response.headers.append("set-cookie", clear_session_cookie())
    return response


@router.get("/api/auth/me")
def me(_token: Annotated[str, Depends(require_session)]) -> dict[str, str]:
    return {"status": "ok"}
