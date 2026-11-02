from __future__ import annotations

import threading
import uuid
import logging
from concurrent.futures import ThreadPoolExecutor

from app.engine.pusch import run_simulation
from app.schemas.simulation import SimulationRequest
from app.services.storage import RunStorage


class JobService:
    def __init__(self, storage: RunStorage) -> None:
        self.storage = storage
        self.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="modemscope-phy")
        self._submit_lock = threading.Lock()
        self._slots = threading.BoundedSemaphore(4)

    def submit(self, request: SimulationRequest) -> dict:
        if not self._slots.acquire(blocking=False):
            raise RuntimeError("The local queue is full. Wait for an experiment to finish.")
        run_id = str(uuid.uuid4())
        try:
            record = self.storage.create(run_id, request.model_dump(mode="json"))
            self.executor.submit(self._execute, run_id, request)
        except Exception:
            self._slots.release()
            raise
        return record

    def _execute(self, run_id: str, request: SimulationRequest) -> None:
        try:
            self.storage.update(run_id, status="running", stage="Initializing Sionna PHY", progress=0.01)

            def report(progress: float, stage: str) -> None:
                self.storage.update(run_id, status="running", progress=max(0.01, progress), stage=stage)

            result = run_simulation(request, report)
            self.storage.update(run_id, status="completed", progress=1.0, stage="Complete", result=result)
        except Exception as exc:
            logging.getLogger(__name__).exception("PHY experiment %s failed", run_id)
            self.storage.update(run_id, status="failed", stage="Simulation failed", error=f"{type(exc).__name__}: PHY execution failed. Check the backend log, verify Sionna 2.2 / PyTorch 2.9, and retry.", progress=1.0)
        finally:
            self._slots.release()
