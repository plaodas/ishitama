from __future__ import annotations

import numpy as np

from app.schemas.stone import Point

TARGET_POINTS = 10_000
GRID_TARGET = 64
MAX_Z_JUMP = 0.09
MIN_INDICES = 36
Z_SCALE = 0.65


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

    return _points_from_samples(rgb, depth, xs, ys, depth[mask] if np.any(mask) else depth)


def build_residual_mesh(
    rgb: np.ndarray,
    depth: np.ndarray,
    mask: np.ndarray,
) -> tuple[list[Point], list[int]]:
    ys, xs = np.nonzero(mask)
    if ys.size == 0:
        return build_point_cloud(rgb, depth, mask), []

    y0, y1 = int(ys.min()), int(ys.max())
    x0, x1 = int(xs.min()), int(xs.max())
    box_h = max(y1 - y0 + 1, 1)
    box_w = max(x1 - x0 + 1, 1)
    step = max(1, int(np.ceil(max(box_h, box_w) / GRID_TARGET)))

    grid_ys = _inclusive_range(y0, y1, step)
    grid_xs = _inclusive_range(x0, x1, step)
    rows, cols = int(grid_ys.size), int(grid_xs.size)
    index_map = np.full((rows, cols), -1, dtype=np.int32)

    sample_ys: list[int] = []
    sample_xs: list[int] = []
    next_index = 0
    for row, y in enumerate(grid_ys):
        for col, x in enumerate(grid_xs):
            if not mask[y, x]:
                continue
            index_map[row, col] = next_index
            next_index += 1
            sample_ys.append(int(y))
            sample_xs.append(int(x))

    if next_index < 3:
        return build_point_cloud(rgb, depth, mask), []

    sample_y_arr = np.asarray(sample_ys, dtype=np.int32)
    sample_x_arr = np.asarray(sample_xs, dtype=np.int32)
    points = _points_from_samples(rgb, depth, sample_x_arr, sample_y_arr, depth[mask])
    zs = np.asarray([point.z for point in points], dtype=np.float32)

    indices: list[int] = []
    for row in range(rows - 1):
        for col in range(cols - 1):
            a = int(index_map[row, col])
            b = int(index_map[row, col + 1])
            c = int(index_map[row + 1, col])
            d = int(index_map[row + 1, col + 1])
            if a >= 0 and b >= 0 and d >= 0 and c >= 0:
                if _z_span(zs, (a, b, c, d)) > MAX_Z_JUMP:
                    continue
                indices.extend((a, c, b, b, c, d))
            else:
                live = tuple(index for index in (a, c, d, b) if index >= 0)
                if len(live) != 3:
                    continue
                if _z_span(zs, live) > MAX_Z_JUMP:
                    continue
                indices.extend(live)

    if len(indices) < MIN_INDICES:
        return build_point_cloud(rgb, depth, mask), []

    return points, indices


def _inclusive_range(start: int, stop: int, step: int) -> np.ndarray:
    values = np.arange(start, stop + 1, step, dtype=np.int32)
    if values.size == 0 or int(values[-1]) != stop:
        values = np.append(values, np.int32(stop))
    return values


def _z_span(zs: np.ndarray, corners: tuple[int, ...]) -> float:
    picked = zs[list(corners)]
    return float(picked.max() - picked.min())


def _points_from_samples(
    rgb: np.ndarray,
    depth: np.ndarray,
    xs: np.ndarray,
    ys: np.ndarray,
    depth_extent: np.ndarray,
) -> list[Point]:
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
    z_min = float(depth_extent.min())
    z_max = float(depth_extent.max())
    zs_n = ((sampled_depth - z_min) / (z_max - z_min + 1e-8) - 0.5) * Z_SCALE

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
