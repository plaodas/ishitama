from __future__ import annotations

import io

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from app.schemas.stone import PointCloud, StoneAnalysis
from app.services.depth import DepthEstimator
from app.services.mask import build_stone_mask
from app.services.message import compose_message
from app.services.pointcloud import build_point_cloud
from app.services.scene import describe_scene
from app.services.sound import build_sound
from app.services.wave import build_wave

MAX_SIDE = 384
MAX_PIXELS = 50_000_000


def analyze_image(
    raw: bytes,
    estimator: DepthEstimator,
    hour: int | None = None,
) -> StoneAnalysis:
    image = _open_rgb(raw)
    image.thumbnail((MAX_SIDE, MAX_SIDE))
    rgb = np.asarray(image)
    depth = estimator.infer(image)
    mask = build_stone_mask(depth)
    points = build_point_cloud(rgb, depth, mask)
    sound = build_sound(image, depth, mask)
    wave = build_wave(depth, sound.noiseLevel, mask)
    scene = describe_scene(image, mask, hour)
    message = compose_message(sound.instrument, wave.level, sound.pitch, scene)
    return StoneAnalysis(
        pointCloud=PointCloud(points=points),
        sound=sound,
        wave=wave,
        message=message,
    )


def _open_rgb(raw: bytes) -> Image.Image:
    try:
        opened = Image.open(io.BytesIO(raw))
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError("unreadable image") from exc
    if opened.format not in {"JPEG", "PNG"}:
        raise ValueError("jpg/png only")
    width, height = opened.size
    if width * height > MAX_PIXELS:
        raise ValueError("image too large")
    try:
        if opened.format == "JPEG":
            opened.draft("RGB", (MAX_SIDE, MAX_SIDE))
        transposed = ImageOps.exif_transpose(opened)
        image = transposed if transposed is not None else opened
        image.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError("unreadable image") from exc
    return image.convert("RGB")
