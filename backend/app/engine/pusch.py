from __future__ import annotations

import importlib.metadata
import time
import threading
from functools import lru_cache
from dataclasses import dataclass
from typing import Any, Callable

import numpy as np

from app.engine.diagnostics import build_diagnostics
from app.engine.metrics import error_counts
from app.schemas.simulation import ChannelModel, SimulationRequest


PRESETS: dict[str, dict[str, Any]] = {
    "qpsk-balanced": {"label": "QPSK · MCS 5", "modulation": "QPSK", "mcs_index": 5, "mcs_table": 1, "bits_per_symbol": 2},
    "16qam-balanced": {"label": "16-QAM · MCS 11", "modulation": "16-QAM", "mcs_index": 11, "mcs_table": 1, "bits_per_symbol": 4},
}
ENGINE_LOCK = threading.Lock()


class SionnaUnavailableError(RuntimeError):
    pass


@dataclass
class EngineInfo:
    available: bool
    sionna_version: str | None
    torch_version: str | None
    device: str
    error: str | None = None


@lru_cache(maxsize=1)
def engine_info() -> EngineInfo:
    try:
        import torch
        import sionna.phy  # noqa: F401
        return EngineInfo(True, importlib.metadata.version("sionna-no-rt"), torch.__version__, "cpu")
    except Exception as exc:
        return EngineInfo(False, None, None, "unavailable", str(exc))


def _complex_samples(values: np.ndarray, limit: int = 700) -> list[dict[str, float]]:
    flat = np.asarray(values).reshape(-1)
    nonzero = flat
    if nonzero.size > limit:
        indices = np.linspace(0, nonzero.size - 1, limit, dtype=int)
        nonzero = nonzero[indices]
    return [{"i": float(v.real), "q": float(v.imag)} for v in nonzero]


def _grid_data(x: np.ndarray, pilot_mask: np.ndarray | None) -> dict[str, Any]:
    grid = np.asarray(x)[0, 0, 0]
    occupied = np.abs(grid) > 1e-8
    classification = np.where(occupied, 1, 0).astype(int)
    if pilot_mask is not None:
        mask = np.asarray(pilot_mask).squeeze()
        if mask.shape == classification.shape:
            # Sionna's pilot-pattern mask is true on pilot/resource positions excluded from data.
            classification[np.logical_and(mask, occupied)] = 2
    return {
        "num_symbols": int(classification.shape[0]),
        "num_subcarriers": int(classification.shape[1]),
        "classification": classification.T.tolist(),
        "legend": {"0": "unused", "1": "data/occupied", "2": "DMRS/pilot"},
    }


def run_simulation(request: SimulationRequest, progress: Callable[[float, str], None] | None = None) -> dict[str, Any]:
    # Sionna's RNG configuration is process-global. Serialize seeding and all PHY work.
    with ENGINE_LOCK:
        return _run_simulation(request, progress)


def _run_simulation(request: SimulationRequest, progress: Callable[[float, str], None] | None = None) -> dict[str, Any]:
    try:
        import torch
        import sionna.phy
        from sionna.phy.channel import AWGN, OFDMChannel, RayleighBlockFading
        from sionna.phy.nr import PUSCHConfig, PUSCHReceiver, PUSCHTransmitter
        from sionna.phy.utils import ebnodb2no
    except Exception as exc:
        raise SionnaUnavailableError(
            "Sionna PHY 2.2 is unavailable. Install backend requirements in Python 3.11+; no synthetic result was substituted."
        ) from exc

    preset = PRESETS[request.preset]
    sionna.phy.config.device = "cpu"
    torch.set_num_threads(2)
    np.random.seed(request.seed)
    torch.manual_seed(request.seed)
    sionna.phy.config.seed = request.seed

    config = PUSCHConfig()
    config.carrier.n_size_grid = 4
    config.num_antenna_ports = 1
    config.num_layers = 1
    config.dmrs.dmrs_port_set = [0]
    config.tb.mcs_index = preset["mcs_index"]
    config.tb.mcs_table = preset["mcs_table"]

    transmitter = PUSCHTransmitter(config)
    actual_bps = int(config.tb.num_bits_per_symbol)
    if actual_bps != preset["bits_per_symbol"]:
        raise RuntimeError(
            f"Preset validation failed: MCS {preset['mcs_index']} resolved to {actual_bps} bits/symbol, expected {preset['bits_per_symbol']}."
        )
    receiver = PUSCHReceiver(transmitter)
    if request.channel_model == ChannelModel.AWGN:
        channel = AWGN()
    else:
        fading = RayleighBlockFading(num_rx=1, num_rx_ant=1, num_tx=1, num_tx_ant=1)
        # RayleighBlockFading already has unit mean power. Per-realization normalization
        # would remove the random amplitude from this single-tap SISO channel.
        channel = OFDMChannel(fading, transmitter.resource_grid, add_awgn=True, normalize_channel=False)

    points: list[dict[str, Any]] = []
    first_visuals: dict[str, Any] | None = None
    point_visuals: list[dict[str, Any]] = []
    ebn0_points = request.ebn0_points()
    started = time.perf_counter()
    for index, ebn0_db in enumerate(ebn0_points):
        if progress:
            progress(index / len(ebn0_points), f"Simulating {ebn0_db:g} dB")
        point_started = time.perf_counter()
        x, bits = transmitter(request.num_blocks)
        no = ebnodb2no(
            ebn0_db,
            transmitter._num_bits_per_symbol,
            transmitter._target_coderate,
            transmitter.resource_grid,
        )
        received = channel(x, no)
        decoded = receiver(received, no)
        tx_np = bits.detach().cpu().numpy()
        rx_np = decoded.detach().cpu().numpy()
        counts = error_counts(tx_np, rx_np)
        point = {
            "ebn0_db": float(ebn0_db),
            **counts,
            "runtime_seconds": time.perf_counter() - point_started,
            "noise_variance": float(torch.as_tensor(no).detach().cpu().item()),
        }
        points.append(point)
        if True:
            x_np = x.detach().cpu().numpy()
            y_np = received.detach().cpu().numpy()
            pilot_mask = getattr(transmitter.pilot_pattern, "mask", None)
            if pilot_mask is not None and hasattr(pilot_mask, "detach"):
                pilot_mask = pilot_mask.detach().cpu().numpy()
            mask = np.asarray(pilot_mask).squeeze()
            if mask.shape != x_np.shape[-2:]:
                raise RuntimeError("The Sionna data mask does not match the transmitted resource grid.")
            data_mask = np.logical_and(mask == 0, np.abs(x_np[0, 0, 0]) > 1e-8)
            # Use identical data-RE indices for transmitted and received samples.
            # Only the first slot is sampled, preserving a meaningful Rayleigh block.
            tx_data = x_np[0, 0, 0][data_mask]
            rx_data = y_np[0, 0, 0][data_mask]
            visuals = {
                "ebn0_db": float(ebn0_db),
                "constellation": {
                    "label": "Aligned data-only frequency-domain resource elements, first slot",
                    "note": "Received points are channel-impaired, not equalized receiver decisions.",
                    "transmitted": _complex_samples(tx_data),
                    "received": _complex_samples(rx_data),
                },
                "resource_grid": _grid_data(x_np, pilot_mask),
            }
            point_visuals.append(visuals)
            if first_visuals is None:
                first_visuals = visuals
    if progress:
        progress(1.0, "Complete")
    return {
        "engine": {
            "name": "NVIDIA Sionna PHY",
            "version": importlib.metadata.version("sionna-no-rt"),
            "torch_version": torch.__version__,
            "device": "cpu",
            "simulator_version": "1.0.0",
        },
        "phy": {
            **preset,
            "effective_bits_per_symbol": actual_bps,
            "target_code_rate": float(transmitter._target_coderate),
            "tb_size": int(config.tb_size),
            "num_prbs": int(config.carrier.n_size_grid),
            "num_layers": int(config.num_layers),
        },
        "measurements": points,
        "visualizations": first_visuals,
        "point_visualizations": point_visuals,
        "diagnostics": build_diagnostics(points),
        "runtime_seconds": time.perf_counter() - started,
        "seed": request.seed,
    }
