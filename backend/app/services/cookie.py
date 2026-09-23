from __future__ import annotations

from app.services.session import SESSION_TTL_SECONDS

SESSION_COOKIE = "__Host-session"


def set_session_cookie(token: str) -> str:
    return (
        f"{SESSION_COOKIE}={token}; HttpOnly; Secure; Path=/; "
        f"SameSite=None; Partitioned; Max-Age={SESSION_TTL_SECONDS}"
    )


def clear_session_cookie() -> str:
    return f"{SESSION_COOKIE}=; HttpOnly; Secure; Path=/; SameSite=None; Partitioned; Max-Age=0"
