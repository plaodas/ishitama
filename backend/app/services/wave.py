from __future__ import annotations

import numpy as np

from app.schemas.stone import Wave

PROFILE_LENGTH = 48


def build_wave(depth: np.ndarray, noise_level: float, mask: np.ndarray) -> Wave:
    profile = _stone_profile(depth, mask)
    level = int(np.clip(1 + noise_level * 6, 1, 9))

    return Wave(
        level=level,
        profile=[round(float(value), 4) for value in profile],
    )


def _stone_profile(depth: np.ndarray, mask: np.ndarray) -> np.ndarray:
    height, width = depth.shape
    if not mask.any():
        center = depth[height // 2, :]
        return np.interp(np.linspace(0, width - 1, PROFILE_LENGTH), np.arange(width), center)

    ys, xs = np.nonzero(mask)
    x0, x1 = int(xs.min()), int(xs.max())
    columns = np.linspace(x0, x1, PROFILE_LENGTH)
    samples = np.full(PROFILE_LENGTH, np.nan, dtype=np.float32)
    for index, column in enumerate(columns):
        xi = int(round(float(column)))
        xi = min(max(xi, 0), width - 1)
        column_mask = mask[:, xi]
        if column_mask.any():
            samples[index] = float(np.median(depth[column_mask, xi]))

    valid = ~np.isnan(samples)
    if not valid.any():
        return np.zeros(PROFILE_LENGTH, dtype=np.float32)
    if valid.all():
        return samples
    filled = np.interp(np.arange(PROFILE_LENGTH), np.flatnonzero(valid), samples[valid])
    return filled.astype(np.float32)
