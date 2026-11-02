from __future__ import annotations

import numpy as np


def error_counts(transmitted: np.ndarray, decoded: np.ndarray) -> dict[str, int | float]:
    """Calculate exact information-bit BER and transport-block BLER counts."""
    tx = np.asarray(transmitted)
    rx = np.asarray(decoded)
    if tx.shape != rx.shape:
        raise ValueError(f"Bit tensor shape mismatch: transmitted {tx.shape}, decoded {rx.shape}")
    if tx.ndim < 2:
        raise ValueError("Bit tensors must include a block dimension and bit dimension.")
    differing = tx.astype(np.int8) != rx.astype(np.int8)
    bit_errors = int(differing.sum())
    num_bits = int(differing.size)
    block_errors = int(np.any(differing.reshape(-1, differing.shape[-1]), axis=1).sum())
    num_blocks = int(np.prod(differing.shape[:-1]))
    return {
        "bit_errors": bit_errors,
        "num_bits": num_bits,
        "ber": bit_errors / num_bits if num_bits else 0.0,
        "block_errors": block_errors,
        "num_blocks": num_blocks,
        "bler": block_errors / num_blocks if num_blocks else 0.0,
    }
