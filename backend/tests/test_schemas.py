import pytest
from pydantic import ValidationError

from app.schemas.simulation import SimulationRequest


def test_quick_point():
    request = SimulationRequest(ebn0_db=3.5)
    assert request.ebn0_points() == [3.5]


def test_sweep_points():
    request = SimulationRequest(mode="sweep", sweep_start_db=-2, sweep_end_db=4, sweep_step_db=2)
    assert request.ebn0_points() == [-2.0, 0.0, 2.0, 4.0]


def test_too_many_sweep_points_rejected():
    with pytest.raises(ValidationError, match="at most 9"):
        SimulationRequest(mode="sweep", sweep_start_db=-4, sweep_end_db=12, sweep_step_db=1)
