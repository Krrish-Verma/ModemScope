from __future__ import annotations

import json
import os
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class RunStorage:
    def __init__(self, path: str | Path | None = None) -> None:
        default_path = Path(__file__).resolve().parents[2] / "data" / "modemscope.db"
        self.path = Path(path or os.getenv("MODEMSCOPE_DB_PATH", default_path))
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as db:
            db.execute("""
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    configuration TEXT NOT NULL,
                    progress REAL NOT NULL DEFAULT 0,
                    stage TEXT NOT NULL,
                    result TEXT,
                    error TEXT
                )
            """)
            db.execute(
                "UPDATE runs SET status='interrupted', stage='Interrupted by backend restart', updated_at=? WHERE status IN ('queued','running')",
                (_utcnow(),),
            )

    @staticmethod
    def _decode(row: sqlite3.Row) -> dict[str, Any]:
        item = dict(row)
        item["configuration"] = json.loads(item["configuration"])
        item["result"] = json.loads(item["result"]) if item["result"] else None
        return item

    def create(self, run_id: str, configuration: dict[str, Any]) -> dict[str, Any]:
        now = _utcnow()
        with self._lock, self._connect() as db:
            db.execute(
                "INSERT INTO runs VALUES (?, 'queued', ?, ?, ?, 0, 'Queued', NULL, NULL)",
                (run_id, now, now, json.dumps(configuration)),
            )
        return self.get(run_id)

    def update(self, run_id: str, **fields: Any) -> dict[str, Any]:
        allowed = {"status", "progress", "stage", "result", "error"}
        values = {key: value for key, value in fields.items() if key in allowed}
        if "result" in values:
            values["result"] = json.dumps(values["result"])
        values["updated_at"] = _utcnow()
        clause = ", ".join(f"{key}=?" for key in values)
        with self._lock, self._connect() as db:
            cursor = db.execute(f"UPDATE runs SET {clause} WHERE id=?", (*values.values(), run_id))
            if not cursor.rowcount:
                raise KeyError(run_id)
        return self.get(run_id)

    def get(self, run_id: str) -> dict[str, Any]:
        with self._connect() as db:
            row = db.execute("SELECT * FROM runs WHERE id=?", (run_id,)).fetchone()
        if row is None:
            raise KeyError(run_id)
        return self._decode(row)

    def list(self, limit: int = 50) -> list[dict[str, Any]]:
        with self._connect() as db:
            rows = db.execute("SELECT * FROM runs ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
        return [self._decode(row) for row in rows]

    def delete(self, run_id: str) -> bool:
        with self._lock, self._connect() as db:
            cursor = db.execute("DELETE FROM runs WHERE id=?", (run_id,))
        return bool(cursor.rowcount)
