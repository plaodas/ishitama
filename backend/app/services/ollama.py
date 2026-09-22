from __future__ import annotations

import json
import logging
import os
import secrets
import urllib.error
import urllib.request

logger = logging.getLogger(__name__)

GENERATE_TIMEOUT = 45.0
WARMUP_TIMEOUT = 180.0


def _base_url() -> str:
    return os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")


def _model() -> str:
    return os.getenv("OLLAMA_MODEL", "qwen2.5:3b")


def chat(
    messages: list[dict[str, str]],
    *,
    num_predict: int,
    temperature: float,
    timeout: float,
) -> str | None:
    options: dict[str, float | int] = {
        "temperature": temperature,
        "num_predict": num_predict,
    }
    if temperature > 0:
        options["seed"] = secrets.randbelow(2**31)
        options["top_k"] = 80
        options["top_p"] = 0.95
    payload = {
        "model": _model(),
        "messages": messages,
        "stream": False,
        "keep_alive": -1,
        "options": options,
    }
    request = urllib.request.Request(
        f"{_base_url()}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        logger.warning("ollama chat failed: %s", exc)
        return None

    message = body.get("message")
    if not isinstance(message, dict):
        return None
    content = message.get("content")
    if not isinstance(content, str):
        return None
    return content


def warm_model() -> None:
    chat(
        [{"role": "user", "content": "。"}],
        num_predict=1,
        temperature=0.0,
        timeout=WARMUP_TIMEOUT,
    )
