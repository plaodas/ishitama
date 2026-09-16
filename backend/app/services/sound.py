from __future__ import annotations

import numpy as np
from PIL import Image

from app.schemas.stone import Instrument, Sound


# def hue_to_instrument(hue: float) -> Instrument:
#     if hue < 30 or hue >= 330:
#         return "ember"
#     if hue < 80:
#         return "earth"
#     if hue < 160:
#         return "moss"
#     if hue < 250:
#         return "water"
#     return "night"

def hue_to_instrument(hue):
    if hue < 40: return "earth"   # 茶・赤み
    if hue < 100: return "moss"   # 緑み
    if hue < 180: return "water"  # 青み
    if hue < 260: return "night"  # 紫・黒
    return "ember"                # 黄・白


def build_sound(image: Image.Image, depth: np.ndarray) -> Sound:
    mean_depth = float(depth.mean())
    std_depth = float(depth.std())
    occupancy = float((depth > 0.45).mean())
    # hsv = np.asarray(image.convert("HSV"))
    # hue = float(hsv[:, :, 0].mean()) * (360.0 / 255.0)
    hsv = np.asarray(image.convert("HSV"))
    hue = float(np.median(hsv[:, :, 0])) * (360.0 / 255.0)

    return Sound(
        pitch=55.0 + (1.0 - mean_depth) * 165.0,
        # noiseLevel=float(np.clip(std_depth / 0.22, 0.0, 1.0)),
        noiseLevel = float(np.clip(std_depth / 0.35, 0.0, 1.0)),
        bpm=40.0 + occupancy * 80.0,
        instrument=hue_to_instrument(hue),
    )
