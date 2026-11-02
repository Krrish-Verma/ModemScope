#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
trap 'kill 0' EXIT
(cd "$project_root/backend" && "$project_root/.venv/bin/python" -m uvicorn app.main:app --reload --port 8000) &
(cd "$project_root/frontend" && npm run dev) &
wait
