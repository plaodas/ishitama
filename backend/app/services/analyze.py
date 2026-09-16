from __future__ import annotations

import io

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from app.schemas.stone import PointCloud, StoneAnalysis
from app.services.depth import DepthEstimator
from app.services.message import compose_message
from app.services.pointcloud import build_point_cloud
from app.services.sound import build_sound
from app.services.wave import build_wave

MAX_SIDE = 384


def analyze_image(raw: bytes, estimator: DepthEstimator) -> StoneAnalysis:
    image = _open_rgb(raw)
    image.thumbnail((MAX_SIDE, MAX_SIDE))
    rgb = np.asarray(image)
    depth = estimator.infer(image)
    points = build_point_cloud(rgb, depth)
    sound = build_sound(image, depth)
    wave = build_wave(depth, sound.noiseLevel)
    message = compose_message(sound.instrument, wave.level, sound.pitch)
    return StoneAnalysis(
        pointCloud=PointCloud(points=points),
        sound=sound,
        wave=wave,
        message=message,
    )


def _open_rgb(raw: bytes) -> Image.Image:
    try:
        opened = Image.open(io.BytesIO(raw))
        fmt = opened.format
        transposed = ImageOps.exif_transpose(opened)
        image = transposed if transposed is not None else opened
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("unreadable image") from exc
    if fmt not in {"JPEG", "PNG"}:
        raise ValueError("jpg/png only")
    return image.convert("RGB")
