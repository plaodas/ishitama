from __future__ import annotations

import numpy as np
from PIL import Image

OCCUPANCY_FULL = 0.85


def describe_scene(image: Image.Image, mask: np.ndarray, hour: int | None) -> str:
    occupancy = float(mask.mean()) if mask.any() else 1.0
    time_label = _time_of_day(hour)
    parts: list[str] = []
    if time_label is not None:
        parts.append(f"今は{time_label}。")

    background = ~mask
    if occupancy > OCCUPANCY_FULL or not background.any():
        parts.append("背景はほとんど写っていない。")
        return "".join(parts)

    hsv = np.asarray(image.convert("HSV"), dtype=np.float32)
    bg = hsv[background]
    value = float(np.median(bg[:, 2])) / 255.0
    saturation = float(np.median(bg[:, 1])) / 255.0
    hue = float(np.median(bg[:, 0])) * (360.0 / 255.0)
    std_value = float(bg[:, 2].std()) / 255.0

    brightness = _brightness(value)
    motion = "ざわついている" if std_value > 0.12 else "静か"
    color = _color_label(hue, saturation)
    parts.append(f"背景の明るさは{brightness}、色は{color}、{motion}。")
    return "".join(parts)


def _time_of_day(hour: int | None) -> str | None:
    if hour is None or hour < 0 or hour > 23:
        return None
    if 5 <= hour < 8:
        return "明け方"
    if 8 <= hour < 16:
        return "昼"
    if 16 <= hour < 19:
        return "宵"
    return "夜"


def _brightness(value: float) -> str:
    if value < 0.33:
        return "暗い"
    if value > 0.66:
        return "明るい"
    return "普通"


def _color_label(hue: float, saturation: float) -> str:
    if saturation < 0.15:
        return "無彩色"
    if hue < 80 or hue >= 280:
        return "暖色"
    if hue < 160:
        return "緑"
    return "寒色"
