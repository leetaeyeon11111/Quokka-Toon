#!/usr/bin/env bash
# Report Quokka-Toon local port status. Exit 0 always (informational).
# Agents: if LISTEN on 8080/5173, reuse — do not start another, do not kill.

set -u

check_port() {
  local port="$1"
  local name="$2"
  local lines
  lines="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$lines" ]]; then
    echo "[FREE]  :$port  ($name) — safe to start"
    return
  fi
  echo "[IN USE] :$port  ($name) — REUSE this; do not start another; do not kill"
  echo "$lines" | awk 'NR==1 || NR>1 {print "         "$0}'
}

echo "=== Quokka-Toon dev ports ==="
check_port 8080 "Spring Boot backend"
check_port 5173 "Vite frontend"
check_port 8000 "Recommend AI (optional)"

if pgrep -lf 'QuokkatoonApplication' >/dev/null 2>&1; then
  echo
  echo "QuokkatoonApplication PIDs:"
  pgrep -lf 'QuokkatoonApplication' | sed 's/^/  /'
fi
