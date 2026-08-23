# 쿼카툰 AI/추천 파트 (recommend/)

웹툰 추천 플랫폼 **쿼카툰**의 AI·NLP 모듈. 자연어 검색 · 웹툰 추천(동적 radar + 추천이유 + 한줄훅) · 취향 리포트를 담당한다.

- **임베딩/검색**: KoSimCSE(`BM-K/KoSimCSE-roberta-multitask`, 768d) + FAISS
- **LLM**: Gemini (`gemini-3.5-flash-lite`) — 추천이유·한줄훅·동적 radar 생성
- **DB**: 팀 MySQL (AWS EC2). 스크립트는 DB를 직접 조회한다.

---

## 1. 환경 설정

```bash
# Python 3.11 + venv 권장
pip install pymysql pandas sqlalchemy sentence-transformers faiss-cpu google-genai

# 환경변수
set GEMINI_API_KEY=<Gemini 키>          # LLM 생성 기능에 필요 (없으면 폴백 동작)
# DB 접속은 스크립트 실행 시 getpass로 비밀번호 입력 (저장 안 함)
```

선택적 환경변수: `QUOKKA_REASON_MODEL`(기본 gemini-3.5-flash-lite), `QUOKKA_LLM_SLEEP`(rate limit 대비 간격), `QUOKKA_DB_HOST/USER/NAME`.

---

## 2. 배치 파이프라인 (실행 순서)

태그 사전 → 임베딩 → radar → 필터메타 순으로 앞 산출물을 뒤가 사용한다.

```bash
# 1) 태그 5축 분류 사전 생성/확장
python expand_axis_map.py
#    → data/axis_map_expanded.json (검수 후 axis_map.json으로 교체)

# 2) 재임베딩 (56k 웹툰, 4060 Ti로 수 분)
python build_embedding.py
#    → models/webtoon_index.faiss, models/webtoon_meta.pkl

# 3) 고정 5축 radar (LLM radar 실패 시 폴백용)
python build_radar.py
#    → models/webtoon_radar.pkl

# 4) 필터 메타 (완결/성인/미디어믹스)
python search_filter.py --build-meta
#    → models/webtoon_filter_meta.pkl
```

신규 웹툰이 추가되면 전체 재구축 대신 증분 반영:
```bash
python update_pipeline.py   # 인덱스에 없는 신규 webtoon_id만 임베딩·radar 추가
```

---

## 3. 검색 사용

```bash
python search_demo.py "완결된 달달한 로맨스"     # 단발
python search_demo.py                            # 대화형
python search_demo.py --reason "환생 복수 무협"   # 추천이유+동적radar 포함(LLM)
```

`--reason`을 켜면 검색 상위 결과에 **한줄훅 + 추천이유 + 동적 radar**가 붙는다(LLM 호출, 웹툰 단위 캐싱). 끄면 기존 고정 radar만 표시(LLM 미사용).

---

## 4. LLM 생성물 (추천 탭 재료)

한 번의 LLM 호출로 **한줄훅 · 추천이유 · 동적 radar 5축**을 함께 생성한다(`make_radar_llm.py`). 웹툰 단위로 캐싱하며, 실패 시 고정 radar + 템플릿 이유로 폴백한다.

```bash
python make_radar_llm.py --demo                       # 샘플 확인
python make_radar_llm.py 1234 5678                     # 특정 웹툰
python make_radar_llm.py --batch --limit 200 --save-db # 대량 생성 후 DB 저장
```

`--batch`는 성인물(age_rating=19)·테스트 데이터를 자동 제외하며, `--save-db`는 결과를 `webtoon.radar_json`·`webtoon.ai_summary` 컬럼에 저장한다.

동적 radar 점수는 LLM 원점수(0~100)를 **50~100 구간으로 압축**해 저장한다(바닥 50, 순위·상대차 보존). radar 각 원소는 `{"axis": 키워드, "score": 정수}` 형태이며 첫 원소가 대표 축이다.

---

## 5. 취향 리포트

인생작(`life_pick`)과 찜(`favorite`)을 가중 집계해 선호 장르(점수+상위%)와 최애 태그(순위)를 산출한다.

```bash
python make_taste_report.py --dummy       # DB 미변경, 가짜 유저로 로직 검증
python make_taste_report.py --user 42     # 실제 유저 → taste_report UPSERT
```

가중치: 인생작 3.0 / 찜 1.0 / 고평점 리뷰 1.5. 필터·노이즈 태그(완결·미친작화 등)는 radar와 동일 기준으로 제외한다.

---

## 6. 백엔드(Spring) 연동 포인트

AI 스크립트가 채우는 DB 필드/테이블을 백엔드가 읽어 화면에 노출한다.

- `webtoon.radar_json` — 동적 radar 5축 JSON (추천율 탭 오각형)
- `webtoon.ai_summary` — 한줄훅 캐치프레이즈 (썸네일 하단)
- `taste_report_genre` — user_id·genre_id·score·top_percent (취향 리포트 장르)
- `taste_report_tag` — user_id·tag_id·count·rank (취향 리포트 최애 태그)
- 검색: `search.py`의 `WebtoonSearcher.search(query, top_k)` → `webtoon_id`·`score_query`·`matched_tags` 반환

추천이유는 웹툰 단위 캐시(`models/webtoon_llm_meta.pkl`)에 저장되며, 필요 시 `--save-db`로 컬럼 저장 로직을 확장할 수 있다.

---

## 7. 파일 구성

| 파일 | 역할 |
|---|---|
| `filter_meta.py` | 공용: 필터 어휘·정규화(`radar_token`)·쿼리 파싱 |
| `llm_client.py` | Gemini 래퍼(JSON 안전, 어미 후처리) |
| `expand_axis_map.py` | 태그 5축 자동 분류(규칙+임베딩+노이즈 제외) |
| `build_embedding.py` | KoSimCSE 임베딩 + FAISS 인덱스 |
| `build_radar.py` | 고정 5축 radar(폴백용) |
| `search.py` | 의미 검색기 `WebtoonSearcher` |
| `search_filter.py` | 필터 메타 구축·적용 |
| `rerank.py` | 인기 재정렬(뷰·평점 데이터 확보 시 활성) |
| `make_radar_llm.py` | **동적 radar + 추천이유 + 한줄훅 통합 생성** |
| `make_reason.py` | 추천이유(작품 소개형) |
| `make_ai_summary.py` | 한줄훅 캐치프레이즈 |
| `make_taste_report.py` | 취향 리포트 배치 |
| `make_training_pairs.py` | fine-tuning 학습쌍(합성쿼리+하드네거티브) |
| `eval_search.py` | 검색 평가(NDCG@10 등) |
| `search_demo.py` | 통합 검색 CLI |
| `update_pipeline.py` | 신규 웹툰 증분 반영 |

---

## 8. 참고 / 알려진 한계

- **kmas 소스 태그 커버리지 40%** — 태그 없는 웹툰은 radar·태그필터 대상에서 제외됨. 태그 보강은 데이터 작업 영역.
- **rerank 비활성** — view/rating 데이터가 0이라 자동 skip(순수 적합도순). 데이터 축적 시 자동 활성.
- **fine-tuning 보류** — 합성 쿼리 평가의 신뢰도 한계로 보류. 실사용 로그 확보 후 재평가 권장.
- **LLM 대량 배치** — 성인물 제외 필터 포함. 크레딧 소모하므로 `--limit`로 분할 실행 권장(캐시로 재실행 안전).
