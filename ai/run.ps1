# 쿼카툰 AI 추천 서비스 실행 (PowerShell)
# 모델 폴더 경로를 이 스크립트 위치의 models/ 로 고정 (독립 폴더 구조 대응)
$env:QUOKKA_MODELS_DIR = Join-Path $PSScriptRoot 'models'

# (선택) LLM 추천이유·한줄훅을 쓰려면 Gemini 키를 넣으세요. 없으면 폴백 동작.
# $env:GEMINI_API_KEY = '<your-gemini-key>'

Write-Host "QUOKKA_MODELS_DIR = $env:QUOKKA_MODELS_DIR"
uvicorn api:app --host 0.0.0.0 --port 8000
