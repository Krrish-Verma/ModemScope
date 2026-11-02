from app.engine.diagnostics import build_diagnostics


def test_zero_error_language_is_statistically_honest():
    insights = build_diagnostics([{"ebn0_db": 10, "ber": 0, "bler": 0, "bit_errors": 0, "num_bits": 1000, "num_blocks": 8}])
    assert any("does not prove" in insight["explanation"] for insight in insights)
    assert any("0 observed errors" in insight["observation"] for insight in insights)
