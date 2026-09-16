from __future__ import annotations

import numpy as np
from PIL import Image

from app.schemas.stone import Instrument, Sound


def hsv_to_instrument(hue: float, saturation: float, value: float) -> Instrument:
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
    if hue < 90:
        return "earth"
    if hue < 160:
        return "moss"
    if hue < 210:
        return "water"
    if hue < 260:
        return "frost"
    return "night"


def build_sound(image: Image.Image, depth: np.ndarray) -> Sound:
    mean_depth = float(depth.mean())
    std_depth = float(depth.std())
    occupancy = float((depth > 0.45).mean())
    hsv = np.asarray(image.convert("HSV"), dtype=np.float32)
    hue = float(np.median(hsv[:, :, 0])) * (360.0 / 255.0)
    saturation = float(np.median(hsv[:, :, 1])) / 255.0
    value = float(np.median(hsv[:, :, 2])) / 255.0

    return Sound(
        pitch=55.0 + (1.0 - mean_depth) * 165.0,
        noiseLevel=float(np.clip(std_depth / 0.35, 0.0, 1.0)),
        bpm=40.0 + occupancy * 80.0,
        instrument=hsv_to_instrument(hue, saturation, value),
    )
