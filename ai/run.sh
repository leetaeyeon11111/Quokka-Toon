#!/usr/bin/env bash
# 쿼카툰 AI 추천 API 실행 (macOS/Linux)
# 프로젝트 루트의 models/ 를 기본으로 사용. 독립 배포 시 ai/models 로 덮어쓸 수 있음.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
cd "$REPO"

if [[ -z "${QUOKKA_MODELS_DIR:-}" ]]; then
  if [[ -d "$REPO/models" ]]; then
    export QUOKKA_MODELS_DIR="$REPO/models"
  else
    export QUOKKA_MODELS_DIR="$ROOT/models"
  fi
fi

if [[ -f "$ROOT/.venv/bin/activate" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT/.venv/bin/activate"
elif [[ -f "$REPO/.venv/bin/activate" ]]; then
  # shellcheck source=/dev/null
  source "$REPO/.venv/bin/activate"
else
  echo "venv 없음. 먼저: cd ai && python3.12 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

# MPS + concurrent model load/encode can SIGSEGV on Apple Silicon — keep encoder on CPU.
# FAISS + PyTorch both ship OpenMP; without this macOS often SIGSEGVs on import/load.
export QUOKKA_ENCODER_DEVICE="${QUOKKA_ENCODER_DEVICE:-cpu}"
export TOKENIZERS_PARALLELISM="${TOKENIZERS_PARALLELISM:-false}"
export KMP_DUPLICATE_LIB_OK="${KMP_DUPLICATE_LIB_OK:-TRUE}"
export OMP_NUM_THREADS="${OMP_NUM_THREADS:-1}"

echo "QUOKKA_MODELS_DIR=$QUOKKA_MODELS_DIR"
echo "QUOKKA_ENCODER_DEVICE=$QUOKKA_ENCODER_DEVICE"
# Single process: do not use --workers >1 (shared FAISS/torch state).
exec uvicorn ai.api:app --host 0.0.0.0 --port 8000 --workers 1
