from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Instrument = Literal[
    "earth",
    "moss",
    "water",
    "ember",
    "night",
    "crystal",
    "shale",
    "sand",
    "frost",
    "moss-deep",
    "dusk",
    "void",
]


class Point(BaseModel):
    x: float
    y: float
    z: float
    r: int = Field(ge=0, le=255)
    g: int = Field(ge=0, le=255)
    b: int = Field(ge=0, le=255)


class PointCloud(BaseModel):
    points: list[Point]
    indices: list[int] = Field(default_factory=list)


class Sound(BaseModel):
    pitch: float
    noiseLevel: float
    bpm: float
    instrument: Instrument


class Wave(BaseModel):
    level: int = Field(ge=1, le=9)
    profile: list[float]


class StoneAnalysis(BaseModel):
    pointCloud: PointCloud
    sound: Sound
    wave: Wave
    message: str
