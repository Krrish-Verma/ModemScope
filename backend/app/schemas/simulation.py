from __future__ import annotations

from enum import Enum
import math
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class ExperimentMode(str, Enum):
    QUICK = "quick"
    SWEEP = "sweep"


class ChannelModel(str, Enum):
    AWGN = "awgn"
    RAYLEIGH = "rayleigh"


class SimulationRequest(BaseModel):
    model_config = {"extra": "forbid", "allow_inf_nan": False}
    mode: ExperimentMode = ExperimentMode.QUICK
    preset: Literal["qpsk-balanced", "16qam-balanced"] = "qpsk-balanced"
    channel_model: ChannelModel = ChannelModel.AWGN
    ebn0_db: float = Field(4.0, ge=-4.0, le=12.0)
    sweep_start_db: float = Field(-2.0, ge=-4.0, le=12.0)
    sweep_end_db: float = Field(8.0, ge=-4.0, le=12.0)
    sweep_step_db: float = Field(2.0, ge=0.5, le=8.0)
    num_blocks: Literal[8, 32, 128] = 8
    seed: int = Field(42, ge=0, le=2_147_483_647)

    @model_validator(mode="after")
    def validate_sweep(self) -> "SimulationRequest":
        if self.mode == ExperimentMode.SWEEP:
            if self.sweep_end_db <= self.sweep_start_db:
                raise ValueError("Sweep end must be greater than sweep start.")
            points = math.floor((self.sweep_end_db - self.sweep_start_db) / self.sweep_step_db + 1e-9) + 1
            if points > 9:
                raise ValueError("A sweep may contain at most 9 Eb/N0 points.")
        return self

    def ebn0_points(self) -> list[float]:
        if self.mode == ExperimentMode.QUICK:
            return [float(self.ebn0_db)]
        points: list[float] = []
        value = self.sweep_start_db
        while value <= self.sweep_end_db + 1e-9:
            points.append(round(float(value), 6))
            value += self.sweep_step_db
        return points


class RunCreated(BaseModel):
    id: str
    status: str


class RunSummary(BaseModel):
    id: str
    status: str
    created_at: str
    updated_at: str
    configuration: dict[str, Any]
    progress: float
    stage: str
    error: str | None = None


class HealthResponse(BaseModel):
    status: str
    sionna_available: bool
    sionna_version: str | None
    torch_version: str | None
    device: str
    capabilities: list[str]
