from __future__ import annotations

import os
from pathlib import Path
from urllib.request import urlretrieve

import numpy as np
import onnxruntime as ort
from PIL import Image

GITHUB_MODEL_URL = (
    "https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/"
    "v2.0.0/depth_anything_v2_vits_dynamic.onnx"
)
MODEL_NAME = "depth_anything_v2_vits_dynamic.onnx"
INPUT_SIZE = 518
PATCH_MULTIPLE = 14
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

_estimator: DepthEstimator | None = None


class DepthEstimator:
    def __init__(self) -> None:
        model_path = _resolve_model_path()
        self.session = ort.InferenceSession(
            model_path,
            providers=["CPUExecutionProvider"],
        )
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

    def infer(self, pil_image: Image.Image) -> np.ndarray:
        pixel_values = _preprocess(pil_image)
        outputs = self.session.run([self.output_name], {self.input_name: pixel_values})
        depth = np.squeeze(np.asarray(outputs[0], dtype=np.float32))
        depth_image = Image.fromarray(depth, mode="F").resize(
            pil_image.size,
            resample=Image.Resampling.BICUBIC,
        )
        depth_np = np.asarray(depth_image, dtype=np.float32)
        depth_np = (depth_np - depth_np.min()) / (depth_np.max() - depth_np.min() + 1e-8)
        return depth_np


def _resolve_model_path() -> str:
    env_path = os.getenv("DEPTH_MODEL_PATH")
    if env_path and Path(env_path).is_file():
        return env_path

    cache_root = Path(os.getenv("HF_HOME", Path.home() / ".cache" / "ishitama"))
    dest = cache_root / MODEL_NAME
    if dest.is_file():
        return str(dest)

    dest.parent.mkdir(parents=True, exist_ok=True)
    urlretrieve(GITHUB_MODEL_URL, dest)
    return str(dest)


def _resize_lower_bound(image: Image.Image) -> Image.Image:
    width, height = image.size
    scale = max(INPUT_SIZE / width, INPUT_SIZE / height)
    new_w = max(PATCH_MULTIPLE, int(round(width * scale / PATCH_MULTIPLE) * PATCH_MULTIPLE))
    new_h = max(PATCH_MULTIPLE, int(round(height * scale / PATCH_MULTIPLE) * PATCH_MULTIPLE))
    return image.resize((new_w, new_h), resample=Image.Resampling.BICUBIC)


def _preprocess(image: Image.Image) -> np.ndarray:
    resized = _resize_lower_bound(image)
    array = np.asarray(resized, dtype=np.float32) * (1.0 / 255.0)
    array = (array - IMAGENET_MEAN) / IMAGENET_STD
    return np.transpose(array, (2, 0, 1))[None, ...].astype(np.float32)


def load_estimator() -> DepthEstimator:
    global _estimator
    if _estimator is None:
        _estimator = DepthEstimator()
    return _estimator


def get_estimator() -> DepthEstimator:
    if _estimator is None:
        raise RuntimeError("Depth estimator is not loaded")
    return _estimator
