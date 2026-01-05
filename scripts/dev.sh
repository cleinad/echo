#!/usr/bin/env bash
set -euo pipefail

pids=()

start() {
  local name="$1"
  shift
  echo "[dev] starting ${name}..."
  "$@" &
  pids+=("$!")
}

cleanup() {
  echo "[dev] stopping..."
  for pid in "${pids[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap cleanup INT TERM EXIT

start "backend" bash -lc "cd backend && source venv/bin/activate && uvicorn main:app --reload"
start "worker" bash -lc "cd backend && source venv/bin/activate && python worker.py"
start "web" bash -lc "cd web && npm run dev"
start "extension" bash -lc "cd extension && npm run dev"

wait -n
