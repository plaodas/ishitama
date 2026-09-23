from __future__ import annotations

import secrets
import time

SESSION_TTL_SECONDS = 12 * 60 * 60

_sessions: dict[str, float] = {}


def _prune(now: float) -> None:
    expired = [token for token, expires_at in _sessions.items() if expires_at <= now]
    for token in expired:
        del _sessions[token]


def create_session() -> str:
    now = time.monotonic()
    _prune(now)
    token = secrets.token_urlsafe(32)
    _sessions[token] = now + SESSION_TTL_SECONDS
    return token


def session_exists(token: str) -> bool:
    now = time.monotonic()
    _prune(now)
    return token in _sessions


def revoke_session(token: str) -> None:
    _sessions.pop(token, None)
