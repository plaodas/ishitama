from __future__ import annotations

import numpy as np

from app.schemas.stone import Wave

PROFILE_LENGTH = 48


def build_wave(depth: np.ndarray, noise_level: float) -> Wave:
    height, width = depth.shape
    center = depth[height // 2, :]
    profile = np.interp(
        np.linspace(0, width - 1, PROFILE_LENGTH),
        np.arange(width),
        center,
    )
    # level = int(np.clip(1 + noise_level * 8, 1, 9))
    level = int(np.clip(1 + noise_level * 6, 1, 9))

    return Wave(
        level=level,
        profile=[round(float(value), 4) for value in profile],
    )
