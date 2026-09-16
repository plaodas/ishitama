from __future__ import annotations

from collections import deque

import numpy as np

MIN_RATIO = 0.05
MAX_RATIO = 0.85
FALLBACK_RADIUS = 0.32


def build_stone_mask(depth: np.ndarray) -> np.ndarray:
    height, width = depth.shape
    smoothed = _smooth(depth)
    center = _center_region(height, width)
    border = _border_region(height, width)

    center_depth = float(np.median(smoothed[center]))
    border_depth = float(np.median(smoothed[border]))
    to_stone = np.abs(smoothed - center_depth)
    to_background = np.abs(smoothed - border_depth)
    candidate = to_stone <= to_background

    if abs(center_depth - border_depth) > 0.08:
        midpoint = (center_depth + border_depth) / 2
        if center_depth > border_depth:
            candidate &= smoothed >= midpoint - 0.05
        else:
            candidate &= smoothed <= midpoint + 0.05

    gradient = _gradient_magnitude(smoothed)
    barrier = gradient > max(float(np.percentile(gradient, 90)), 1e-6)
    passable = candidate & ~barrier
    passable[center] = passable[center] | candidate[center]

    seed = _seed_from_center(passable, height, width)
    if seed is None:
        return _ellipse_mask(height, width, FALLBACK_RADIUS)

    mask = _flood(passable, seed)
    mask = _dilate(mask, 1)
    mask = _erode(mask, 1)
    mask = _fill_holes(mask)

    ratio = float(mask.mean())
    if ratio < MIN_RATIO or ratio > MAX_RATIO:
        return _ellipse_mask(height, width, FALLBACK_RADIUS)
    return mask


def _smooth(depth: np.ndarray, radius: int = 2) -> np.ndarray:
    kernel = np.ones(radius * 2 + 1, dtype=np.float32) / float(radius * 2 + 1)
    padded = np.pad(depth.astype(np.float32), ((0, 0), (radius, radius)), mode="edge")
    horizontal = np.apply_along_axis(lambda row: np.convolve(row, kernel, mode="valid"), 1, padded)
    padded = np.pad(horizontal, ((radius, radius), (0, 0)), mode="edge")
    return np.apply_along_axis(lambda col: np.convolve(col, kernel, mode="valid"), 0, padded)


def _center_region(height: int, width: int) -> np.ndarray:
    y0, y1 = int(height * 0.30), int(height * 0.70)
    x0, x1 = int(width * 0.30), int(width * 0.70)
    region = np.zeros((height, width), dtype=bool)
    region[y0:y1, x0:x1] = True
    return region


def _border_region(height: int, width: int) -> np.ndarray:
    margin_y = max(2, int(height * 0.08))
    margin_x = max(2, int(width * 0.08))
    region = np.zeros((height, width), dtype=bool)
    region[:margin_y, :] = True
    region[-margin_y:, :] = True
    region[:, :margin_x] = True
    region[:, -margin_x:] = True
    return region


def _gradient_magnitude(depth: np.ndarray) -> np.ndarray:
    grad_y, grad_x = np.gradient(depth)
    return np.hypot(grad_x, grad_y)


def _seed_from_center(mask: np.ndarray, height: int, width: int) -> tuple[int, int] | None:
    cy, cx = height // 2, width // 2
    if mask[cy, cx]:
        return cy, cx
    ys, xs = np.nonzero(mask & _ellipse_mask(height, width, 0.22))
    if ys.size == 0:
        ys, xs = np.nonzero(mask & _center_region(height, width))
    if ys.size == 0:
        return None
    nearest = int(np.argmin((ys - cy) ** 2 + (xs - cx) ** 2))
    return int(ys[nearest]), int(xs[nearest])


def _flood(passable: np.ndarray, seed: tuple[int, int]) -> np.ndarray:
    height, width = passable.shape
    sy, sx = seed
    if not passable[sy, sx]:
        return np.zeros_like(passable)
    visited = np.zeros_like(passable)
    queue: deque[tuple[int, int]] = deque([(sy, sx)])
    visited[sy, sx] = True
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < height and 0 <= nx < width and passable[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                queue.append((ny, nx))
    return visited


def _fill_holes(mask: np.ndarray) -> np.ndarray:
    background = ~mask
    height, width = mask.shape
    reachable = np.zeros_like(mask)
    queue: deque[tuple[int, int]] = deque()
    for y in range(height):
        for x in (0, width - 1):
            if background[y, x] and not reachable[y, x]:
                reachable[y, x] = True
                queue.append((y, x))
    for x in range(width):
        for y in (0, height - 1):
            if background[y, x] and not reachable[y, x]:
                reachable[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < height and 0 <= nx < width and background[ny, nx] and not reachable[ny, nx]:
                reachable[ny, nx] = True
                queue.append((ny, nx))
    return mask | (background & ~reachable)


def _dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    height, width = mask.shape
    padded = np.pad(mask, radius, mode="constant", constant_values=False)
    out = np.zeros_like(mask)
    for dy in range(radius * 2 + 1):
        for dx in range(radius * 2 + 1):
            out |= padded[dy : dy + height, dx : dx + width]
    return out


def _erode(mask: np.ndarray, radius: int) -> np.ndarray:
    return ~_dilate(~mask, radius)


def _ellipse_mask(height: int, width: int, radius: float) -> np.ndarray:
    ys, xs = np.ogrid[:height, :width]
    cy = (height - 1) / 2
    cx = (width - 1) / 2
    ry = max(height * radius, 1.0)
    rx = max(width * radius, 1.0)
    return ((ys - cy) / ry) ** 2 + ((xs - cx) / rx) ** 2 <= 1.0
