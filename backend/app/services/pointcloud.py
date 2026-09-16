from __future__ import annotations

import numpy as np

from app.schemas.stone import Point

TARGET_POINTS = 10_000


def build_point_cloud(rgb: np.ndarray, depth: np.ndarray) -> list[Point]:
    height, width = depth.shape
    stride = max(1, int(np.sqrt((height * width) / TARGET_POINTS)))
    ys, xs = np.mgrid[0:height:stride, 0:width:stride]
    sampled_depth = depth[ys, xs]
    sampled_rgb = rgb[ys, xs]

    xs_n = xs.astype(np.float32) / width - 0.5
    ys_n = -(ys.astype(np.float32) / height - 0.5)
    zs_n = (sampled_depth - 0.5) * 0.65

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
            xs_n.ravel(),
            ys_n.ravel(),
            zs_n.ravel(),
            sampled_rgb[:, :, 0].ravel(),
            sampled_rgb[:, :, 1].ravel(),
            sampled_rgb[:, :, 2].ravel(),
            strict=True,
        )
    ]
