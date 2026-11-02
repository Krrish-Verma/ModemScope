import pytest

from app.engine.pusch import engine_info, run_simulation
from app.schemas.simulation import SimulationRequest


pytestmark = pytest.mark.skipif(not engine_info().available, reason="Sionna PHY is not installed")


@pytest.mark.parametrize("preset,expected_bps", [("qpsk-balanced", 2), ("16qam-balanced", 4)])
def test_awgn_real_pusch_path(preset, expected_bps):
    result = run_simulation(SimulationRequest(preset=preset, ebn0_db=4, num_blocks=8, seed=7))
    point = result["measurements"][0]
    assert result["phy"]["effective_bits_per_symbol"] == expected_bps
    assert 0 <= point["ber"] <= 1
    assert 0 <= point["bler"] <= 1
    assert point["ber"] == point["bit_errors"] / point["num_bits"]
    assert point["bler"] == point["block_errors"] / point["num_blocks"]
    assert result["visualizations"]["constellation"]["transmitted"]


def test_rayleigh_real_pusch_path():
    result = run_simulation(SimulationRequest(channel_model="rayleigh", ebn0_db=6, num_blocks=8, seed=11))
    assert result["measurements"][0]["num_blocks"] == 8


def test_seed_reproducibility():
    request = SimulationRequest(ebn0_db=0, num_blocks=8, seed=123)
    first = run_simulation(request)["measurements"][0]
    second = run_simulation(request)["measurements"][0]
    for key in ("bit_errors", "num_bits", "block_errors", "num_blocks"):
        assert first[key] == second[key]
