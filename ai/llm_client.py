"""
쿼카툰 - 공용 LLM 클라이언트 (Gemini 무료 우선)
================================================
B(합성 쿼리), 추천이유 생성, ai_summary 생성이 공통으로 사용.

정책:
  - Gemini Flash 무료 우선 (google-genai). JSON 깨짐 심하면 Claude Haiku로 교체 가능한 구조.
  - 라이브러리/키 없으면 graceful하게 None 반환 → 호출부가 규칙기반 폴백으로 진행.
  - JSON 응답은 코드펜스 제거 후 안전 파싱, 1회 재시도.

환경변수:
  GEMINI_API_KEY   : Gemini 키
  QUOKKA_LLM_MODEL : 모델명 (기본 gemini-2.5-flash)
"""
import json
import os
import re
import time

HERE = os.path.dirname(os.path.abspath(__file__))


def _load_local_env():
    """Load ai/.env without overriding values supplied by the process."""
    env_path = os.path.join(HERE, ".env")
    try:
        with open(env_path, encoding="utf-8") as env_file:
            for raw_line in env_file:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()
                if value[:1] == value[-1:] and value[:1] in {"'", '"'}:
                    value = value[1:-1]
                if key and key not in os.environ:
                    os.environ[key] = value
    except FileNotFoundError:
        pass


_load_local_env()

_MODEL = os.environ.get("QUOKKA_LLM_MODEL", "gemini-3.5-flash-lite")


def get_client():
    """google-genai 클라이언트. 없으면 None (호출부에서 폴백)."""
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=key)
    except Exception:
        return None


def _strip_fences(text):
    text = re.sub(r"^```(?:json)?", "", text.strip())
    text = re.sub(r"```$", "", text.strip())
    return text.strip()


def fix_endings(text):
    """LLM 어미 중복 정리: '주세요요'→'주세요', '한답니다다'→'한답니다' 등."""
    if not text:
        return text
    text = re.sub(r'(요)\1+', r'\1', text)          # 요요/요요요 → 요
    text = re.sub(r'(니다)\1+', r'\1', text)         # 니다니다 → 니다
    text = re.sub(r'(답니다)다+', r'\1', text)       # 답니다다 → 답니다
    text = re.sub(r'\s+([.!?,])', r'\1', text)       # 문장부호 앞 공백 정리
    return text.strip()


def generate_text(prompt, client=None, model=None, retries=1):
    """자유 텍스트 생성. 실패 시 None."""
    client = client or get_client()
    if client is None:
        return None
    model = model or _MODEL
    debug = os.environ.get("QUOKKA_LLM_DEBUG")
    for attempt in range(retries + 1):
        try:
            resp = client.models.generate_content(model=model, contents=prompt)
            return (resp.text or "").strip()
        except Exception as e:
            if debug:
                print(f"[llm_client] 생성 실패({model}): {e}")
            if attempt < retries:
                time.sleep(1.0)
    return None


def generate_json(prompt, client=None, model=None, retries=1):
    """
    JSON 응답 생성 + 안전 파싱. 실패 시 None.
    프롬프트에는 'JSON만 출력' 지시를 넣어두는 것을 권장.
    """
    client = client or get_client()
    if client is None:
        return None
    model = model or _MODEL
    for attempt in range(retries + 1):
        raw = generate_text(prompt, client=client, model=model, retries=0)
        if raw:
            try:
                return json.loads(_strip_fences(raw))
            except json.JSONDecodeError:
                pass
        if attempt < retries:
            time.sleep(1.0)
    return None


def available():
    return get_client() is not None


if __name__ == "__main__":
    print("LLM 사용 가능:", available(), f"(모델 {_MODEL})")
    if available():
        print(generate_text("한 문장으로 자기소개해줘."))
