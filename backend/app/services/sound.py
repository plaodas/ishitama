from __future__ import annotations

import numpy as np
from PIL import Image

from app.schemas.stone import Instrument, Sound


def hsv_to_instrument(hue: float, saturation: float, value: float) -> Instrument:
    if value < 0.12:
        return "void"

    if saturation < 0.15:
        if value > 0.85:
            return "crystal"
        if value < 0.35:
            return "shale"
        return "earth"

    if hue < 20 or hue >= 330:
        return "ember"
    if hue < 45:
        return "sand"
    if hue < 80:
        return "earth"
    if hue < 120:
        return "moss"
    if hue < 160:
        return "moss-deep"
    if hue < 200:
        return "water"
    if hue < 240:
        return "frost"
    if hue < 280:
        return "dusk"
    return "night"


def build_sound(image: Image.Image, depth: np.ndarray, mask: np.ndarray) -> Sound:
    stone_depth = depth[mask] if mask.any() else depth.ravel()
    mean_depth = float(stone_depth.mean())
    std_depth = float(stone_depth.std())
    occupancy = float(mask.mean()) if mask.any() else float((depth > 0.45).mean())
    hsv = np.asarray(image.convert("HSV"), dtype=np.float32)
    stone_hsv = hsv[mask] if mask.any() else hsv.reshape(-1, 3)
    hue = float(np.median(stone_hsv[:, 0])) * (360.0 / 255.0)
    saturation = float(np.median(stone_hsv[:, 1])) / 255.0
    value = float(np.median(stone_hsv[:, 2])) / 255.0

    return Sound(
        pitch=55.0 + (1.0 - mean_depth) * 165.0,
        noiseLevel=float(np.clip(std_depth / 0.35, 0.0, 1.0)),
        bpm=40.0 + occupancy * 80.0,
        instrument=hsv_to_instrument(hue, saturation, value),
    )
