from app.services.storage import RunStorage


def test_storage_round_trip_and_delete(tmp_path):
    storage = RunStorage(tmp_path / "runs.db")
    storage.create("run-1", {"seed": 42})
    storage.update("run-1", status="completed", progress=1, stage="Complete", result={"ok": True})
    record = storage.get("run-1")
    assert record["configuration"]["seed"] == 42
    assert record["result"] == {"ok": True}
    assert storage.delete("run-1") is True
