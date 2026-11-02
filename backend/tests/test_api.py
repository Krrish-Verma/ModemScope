from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_options_are_bounded_and_presets_are_explicit():
    response = client.get("/api/config/options")
    assert response.status_code == 200
    body = response.json()
    assert body["ranges"]["max_sweep_points"] == 9
    assert body["presets"]["qpsk-balanced"]["bits_per_symbol"] == 2
    assert body["presets"]["16qam-balanced"]["bits_per_symbol"] == 4


def test_invalid_request_is_422():
    response = client.post("/api/runs", json={"ebn0_db": 99})
    assert response.status_code == 422
