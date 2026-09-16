from __future__ import annotations

import numpy as np

from app.schemas.stone import Point

TARGET_POINTS = 10_000


def build_point_cloud(rgb: np.ndarray, depth: np.ndarray, mask: np.ndarray) -> list[Point]:
    ys, xs = np.nonzero(mask)
    if ys.size == 0:
        height, width = depth.shape
        ys, xs = np.mgrid[0:height, 0:width]
        ys = ys.ravel()
        xs = xs.ravel()

    if ys.size > TARGET_POINTS:
        step = max(1, ys.size // TARGET_POINTS)
        ys = ys[::step][:TARGET_POINTS]
        xs = xs[::step][:TARGET_POINTS]

    sampled_depth = depth[ys, xs]
    sampled_rgb = rgb[ys, xs]
    xs_f = xs.astype(np.float32)
    ys_f = ys.astype(np.float32)
    center_x = float(np.mean(xs_f))
    center_y = float(np.mean(ys_f))
    offset_x = xs_f - center_x
    offset_y = -(ys_f - center_y)
    span = float(max(np.ptp(offset_x), np.ptp(offset_y), 1.0))
    xs_n = offset_x / span
    ys_n = offset_y / span
    z_min = float(sampled_depth.min())
    z_max = float(sampled_depth.max())
    zs_n = ((sampled_depth - z_min) / (z_max - z_min + 1e-8) - 0.5) * 0.65

    return [
        Point(
            x=float(x),
            y=float(y),
            z=float(z),
            r=int(r),
            g=int(g),
            b=int(b),
        )
        for x, y, z, r, g, b in zip(
            xs_n,
            ys_n,
            zs_n,
            sampled_rgb[:, 0],
            sampled_rgb[:, 1],
            sampled_rgb[:, 2],
            strict=True,
        )
    ]
