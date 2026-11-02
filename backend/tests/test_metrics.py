import numpy as np
import pytest

from app.engine.metrics import error_counts


def test_exact_error_counts():
    transmitted = np.array([[0, 1, 1, 0], [1, 0, 1, 0]])
    decoded = np.array([[0, 0, 1, 0], [1, 0, 0, 0]])
    result = error_counts(transmitted, decoded)
    assert result == {
        "bit_errors": 2,
        "num_bits": 8,
        "ber": 0.25,
        "block_errors": 2,
        "num_blocks": 2,
        "bler": 1.0,
    }


def test_shape_mismatch_rejected():
    with pytest.raises(ValueError, match="shape mismatch"):
        error_counts(np.zeros((2, 4)), np.zeros((2, 5)))
