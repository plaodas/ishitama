from __future__ import annotations

import ctypes
import gc
import logging

logger = logging.getLogger(__name__)


def trim_idle_rss() -> None:
    gc.collect()
    try:
        libc = ctypes.CDLL("libc.so.6")
        libc.malloc_trim(0)
    except (OSError, AttributeError) as exc:
        logger.debug("malloc_trim skipped: %s", exc)
