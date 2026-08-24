@echo off
REM 쿼카툰 AI 추천 서비스 실행 (cmd)
REM 모델 폴더 경로를 이 스크립트 위치의 models\ 로 고정 (독립 폴더 구조 대응)
set "QUOKKA_MODELS_DIR=%~dp0models"

REM (선택) LLM 추천이유·한줄훅을 쓰려면 Gemini 키를 넣으세요. 없으면 폴백 동작.
REM set "GEMINI_API_KEY=<your-gemini-key>"

echo QUOKKA_MODELS_DIR=%QUOKKA_MODELS_DIR%
uvicorn api:app --host 0.0.0.0 --port 8000
