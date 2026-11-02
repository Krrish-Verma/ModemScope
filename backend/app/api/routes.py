from __future__ import annotations

import csv
import io
import json

from fastapi import APIRouter, HTTPException, Response, status

from app.engine.pusch import PRESETS, engine_info
from app.schemas.simulation import HealthResponse, RunCreated, SimulationRequest
from app.services.jobs import JobService
from app.services.storage import RunStorage


storage = RunStorage()
jobs = JobService(storage)
router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    info = engine_info()
    return HealthResponse(
        status="ready" if info.available else "degraded",
        sionna_available=info.available,
        sionna_version=info.sionna_version,
        torch_version=info.torch_version,
        device=info.device,
        capabilities=["5G NR PUSCH", "AWGN", "Rayleigh block fading", "Eb/N0 sweep"] if info.available else [],
    )


@router.get("/config/options")
def options() -> dict:
    return {
        "presets": PRESETS,
        "channels": [
            {"id": "awgn", "label": "AWGN"},
            {"id": "rayleigh", "label": "Rayleigh block fading"},
        ],
        "ranges": {"ebn0_db": [-4, 12], "max_sweep_points": 9, "blocks": [8, 32, 128]},
    }


@router.post("/runs", response_model=RunCreated, status_code=status.HTTP_202_ACCEPTED)
def create_run(request: SimulationRequest) -> RunCreated:
    if not engine_info().available:
        raise HTTPException(status_code=503, detail="Sionna PHY is unavailable; install backend requirements before running experiments.")
    try:
        record = jobs.submit(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    return RunCreated(id=record["id"], status=record["status"])


@router.get("/runs")
def list_runs() -> list[dict]:
    return storage.list()


def _get_run(run_id: str) -> dict:
    try:
        return storage.get(run_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Experiment not found.") from exc


@router.get("/runs/{run_id}")
def get_run(run_id: str) -> dict:
    return _get_run(run_id)


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_run(run_id: str) -> Response:
    if _get_run(run_id)["status"] in {"queued", "running"}:
        raise HTTPException(status_code=409, detail="Wait until the experiment finishes before deleting it.")
    if not storage.delete(run_id):
        raise HTTPException(status_code=404, detail="Experiment not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/runs/{run_id}/export.json")
def export_json(run_id: str) -> Response:
    record = _get_run(run_id)
    return Response(
        json.dumps(record, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="modemscope-{run_id}.json"'},
    )


@router.get("/runs/{run_id}/export.csv")
def export_csv(run_id: str) -> Response:
    record = _get_run(run_id)
    if record["status"] != "completed" or not record["result"]:
        raise HTTPException(status_code=409, detail="Only completed experiments can be exported as CSV.")
    config = record["configuration"]
    phy = record["result"]["phy"]
    buffer = io.StringIO()
    fields = ["experiment_id", "ebn0_db", "channel_model", "modulation", "mcs_index", "ber", "bler", "num_bits", "bit_errors", "num_blocks", "block_errors", "seed"]
    writer = csv.DictWriter(buffer, fieldnames=fields)
    writer.writeheader()
    for point in record["result"]["measurements"]:
        writer.writerow({
            "experiment_id": run_id,
            "ebn0_db": point["ebn0_db"],
            "channel_model": config["channel_model"],
            "modulation": phy["modulation"],
            "mcs_index": phy["mcs_index"],
            "ber": point["ber"],
            "bler": point["bler"],
            "num_bits": point["num_bits"],
            "bit_errors": point["bit_errors"],
            "num_blocks": point["num_blocks"],
            "block_errors": point["block_errors"],
            "seed": config["seed"],
        })
    return Response(
        buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="modemscope-{run_id}.csv"'},
    )
