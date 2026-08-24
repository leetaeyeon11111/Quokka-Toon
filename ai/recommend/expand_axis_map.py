"""
쿼카툰 - 태그 5축 자동 분류 (axis_map 확장)
==========================================
목적:
  팀 DB의 tag 테이블 전체를 5축(장르/테마/감성/캐릭터/배경)에 자동 배치해
  data/axis_map.json 시드를 '확장본'으로 만든다.
  → build_radar.py가 이 확장본으로 더 정확한 radar_json 생성.

분류 캐스케이드 (위에서부터, 먼저 걸리면 확정):
  1) SEED     : 시드 사전에 이미 있는 태그 → 그 축 (confidence 1.00)
  2) RULE     : 한국어 접미/키워드 규칙 → 해당 축 (confidence 0.75)
  3) EMBED    : KoSimCSE로 태그 vs 축 앵커 코사인 최근접 (confidence = 유사도)
  4) REVIEW   : 위에서 못 잡은 것 → 미분류. review CSV로 빼서 사람이 확인/LLM

산출물:
  data/axis_map_expanded.json   : 5축 확장 사전 (build_radar.py가 그대로 사용)
  data/axis_map_review.csv      : (tag, usage_count, 배정축, method, confidence)
                                  → confidence 낮은 것/미분류만 눈으로 보정 후 반영

데이터 소스:
  기본: 팀 MySQL(tag 테이블)에서 SELECT
  대체: --csv tags.csv  (name,usage_count 컬럼) 로 오프라인 실행 가능

실행:
  python expand_axis_map.py              # DB에서 태그 읽기 (비번 입력)
  python expand_axis_map.py --no-embed   # 임베딩 생략 (시드+규칙만, 빠른 확인용)
  python expand_axis_map.py --csv tags.csv
"""

import argparse
import csv
import json
import os
import re
import sys

AXES = ["장르", "테마", "감성", "캐릭터", "배경"]

# 임베딩 분류 신뢰 컷: 애매하면 억지 배정 대신 미분류로 (캐릭터 쏠림 방지)
EMBED_MIN_CONF = 0.42     # 1위 코사인 절대값 하한
EMBED_MIN_MARGIN = 0.03   # 1위-2위 차 하한

# 필터/메타성 태그는 A와 공유하는 filter_meta 기준으로 정규화한다.
# 순수 필터(완결/무료/19금/드라마화)는 제외, 완결로맨스→로맨스처럼 내용부는 살려 분류.
from filter_meta import radar_token

HERE = os.path.dirname(os.path.abspath(__file__))
SEED_PATH = os.path.join(HERE, "..", "data", "axis_map.json")
OUT_PATH = os.path.join(HERE, "..", "data", "axis_map_expanded.json")
REVIEW_PATH = os.path.join(HERE, "..", "data", "axis_map_review.csv")

# 임베딩 축 앵커: 각 축이 '무엇을 뜻하는지'를 문장으로 서술.
# KoSimCSE가 태그를 이 문장들과 비교해 가장 가까운 축을 고른다.
AXIS_ANCHORS = {
    "장르": "웹툰의 장르 분류. 로맨스, 판타지, 무협, 액션, 스릴러, 드라마, 개그, BL 같은 작품 갈래.",
    "테마": "이야기의 소재와 설정. 회귀, 빙의, 환생, 복수, 계약, 삼각관계, 성장, 육아 같은 서사 장치.",
    "감성": "작품이 주는 분위기와 감정. 달달함, 설렘, 힐링, 피폐, 애증, 통쾌함, 긴장감 같은 정서.",
    "캐릭터": "등장인물의 성격과 유형. 먼치킨, 집착남, 다정남, 츤데레, 걸크러쉬, 재벌, 천재 같은 캐릭터성.",
    "배경": "이야기가 펼쳐지는 시공간과 장소. 현대, 서양, 동양, 학원, 회사, 왕궁, 이세계 같은 배경.",
}

# ---------------------------------------------------------------------------
# 2) 규칙 기반 분류 (한국어 접미/키워드)
#    - 접미 패턴은 강한 신호. 키워드 포함은 그다음.
#    - 순서 중요: 위 규칙이 먼저 매칭됨.
# ---------------------------------------------------------------------------

# 축과 무관한 노이즈 태그(프로모션·품질평·공모전 등) → 축에서 제외
NOISE_PATTERNS = [
    r"공모전", r"지상최대", r"추천작", r"요즘\s*핫", r"핫한", r"고퀄", r"퀄리티",
    r"미친작화", r"작화", r"베스트", r"인기작", r"명작", r"화제작", r"이벤트",
    r"신작", r"완결무료", r"무료", r"단행본", r"웹툰화", r"연재", r"^\d{4}",
    r"기다무", r"기다리면", r"성인웹툰", r"평점", r"해외작품", r"컷툰", r"넥스큐브",
]

def is_noise(tag):
    return any(re.search(p, tag) for p in NOISE_PATTERNS)


# (정규식, 축) — 접미/형태 기반. 태그명 끝/구조에서 축을 추정.
SUFFIX_RULES = [
    (r"(남|녀|남주|여주|주인공|캐릭|형|누나|오빠|언니|동생)$", "캐릭터"),
    (r"물$", "테마"),                  # ~물: 회귀물/빙의물/오해물 등 대개 소재·테마성 하위장르
    (r"(극|판)$", "장르"),              # 복수극/로판 등 → 장르 (테마 키워드는 위에서 먼저 매칭됨)
    (r"(계|계열|풍)$", "감성"),
]

# 축별 포함 키워드 (부분 문자열). 태그 안에 이 조각이 들어가면 해당 축.
KEYWORD_RULES = {
    "감성": [
        "달달", "설렘", "설레", "힐링", "피폐", "애증", "잔잔", "먹먹", "따뜻",
        "몽글", "짜릿", "통쾌", "사이다", "긴장", "몰입", "귀여", "발랄", "러블리",
        "감성", "자극", "시리어스", "애잔", "아련", "공감", "쫄깃", "청량",
        "고구마", "새드", "새콤", "달콤", "웃기", "코믹", "병맛", "빵터", "궁금하게",
        "소유욕", "독점", "설렘폭발", "역동적", "무해", "사랑스러", "스릴 넘", "스릴넘",
        "치명적", "훈훈", "먹먹한", "잔잔", "처절", "열혈",
    ],
    "테마": [
        "회귀", "빙의", "환생", "복수", "계약", "삼각", "육아", "성장", "재회",
        "생존", "운명", "차원", "세계관", "시스템", "게임", "능력", "각성",
        "후회", "오해", "짝사랑", "첫사랑", "우정", "가족", "시대", "역전",
        "자본", "주식", "정치", "전쟁", "학원물", "소설원작", "리메이크",
        "배틀", "격투", "전투", "무공", "최강", "힘숨찐", "하렘", "역하렘",
        "라이벌", "신분", "던전", "레벨", "성좌", "탑등반", "먼치킨",
        "소꿉친구", "아포칼립스", "권선징악", "구원", "동거", "정략결혼", "결혼생활",
        "귀환", "상태창", "플레이어", "서바이벌", "서바이벌", "두뇌싸움", "트라우마",
        "친구", "결혼", "복학", "치유", "무한루프", "타임슬립",
        "신화", "참교육", "혐관", "환골탈태", "썸", "기억상실", "음식", "요리", "복수극",
    ],
    "배경": [
        "학원", "캠퍼스", "학교", "회사", "오피스", "궁정", "왕궁", "왕족",
        "귀족", "현대", "서양", "동양", "이세계", "시골", "도시", "군대",
        "중세", "미래", "우주", "판타지세계", "무림", "제국", "황궁",
        "마법", "마도", "사내", "전문직", "직장", "현실", "하이틴", "무대",
    ],
    "캐릭터": [
        "먼치킨", "집착", "다정", "까칠", "순정", "천재", "재벌", "회장",
        "츤데레", "능글", "직진", "짐승", "냉미", "연하", "연상", "걸크러",
        "나쁜남자", "상처", "외유내강", "평범", "고인물", "빌런", "악녀",
        "황제", "기사", "메이드", "집사", "용사", "크리처", "이종족", "인외",
        "초월적", "영웅", "마왕", "드래곤", "악역", "히어로",
        "조력자", "햇살캐", "검사", "플레이어캐", "직업", "여신", "황녀", "공작",
        "중심", "만능", "개성있", "검객", "검사",
    ],
    "장르": [
        "로맨스", "판타지", "무협", "액션", "스릴러", "드라마", "개그", "코미디",
        "미스터리", "호러", "공포", "느와르", "sf", "bl", "gl", "백합",
        "로판", "로맨틱", "성장드라마", "일상", "범죄", "오컬트",
        "서스펜스", "스포츠", "무협/사극", "판타지드라마", "판무", "판타지무협",
    ],
}


def load_seed():
    with open(SEED_PATH, encoding="utf-8") as f:
        m = json.load(f)
    seed = {}
    for ax in AXES:
        for tag in m.get(ax, []):
            seed[tag] = ax
    return seed


def classify_by_rule(tag):
    """규칙으로 축 추정. 못 정하면 None."""
    low = tag.lower()

    # 단일 글자/특수 태그 예외 처리
    if tag in {"검", "궁", "활"}:
        return "캐릭터", 0.70, "rule:exact"

    # 키워드 포함이 접미보다 의미가 분명한 경우가 많아 먼저 검사.
    # (감성 > 캐릭터 > 테마 > 배경 > 장르 우선순위: 정서/인물 신호를 장르보다 우선)
    for ax in ["감성", "캐릭터", "테마", "배경", "장르"]:
        for kw in KEYWORD_RULES[ax]:
            if kw.lower() in low:
                return ax, 0.75, "rule:kw"

    for pat, ax in SUFFIX_RULES:
        if re.search(pat, tag):
            return ax, 0.70, "rule:suffix"

    return None


def classify_by_embedding(unresolved, batch_verbose=True):
    """
    KoSimCSE로 태그 vs 축 앵커 코사인 최근접.
    반환: {tag: (axis, confidence, "embed")}
    모델 로드 실패 시 빈 dict (전부 review로 감).
    """
    result = {}
    if not unresolved:
        return result
    try:
        import numpy as np
        from sentence_transformers import SentenceTransformer

        # 팀 표준 임베딩 모델 (build_embedding.py와 동일해야 일관성 있음)
        model_name = os.environ.get("KOSIMCSE_MODEL", "BM-K/KoSimCSE-roberta-multitask")
        if batch_verbose:
            print(f"  [embed] 모델 로드: {model_name} ...")
        model = SentenceTransformer(model_name)

        anchor_texts = [AXIS_ANCHORS[ax] for ax in AXES]
        anchor_vecs = model.encode(anchor_texts, normalize_embeddings=True)
        tag_vecs = model.encode(list(unresolved), normalize_embeddings=True,
                                batch_size=256, show_progress_bar=batch_verbose)

        sims = tag_vecs @ anchor_vecs.T          # (N, 5) 코사인
        for i, tag in enumerate(unresolved):
            order = np.argsort(sims[i])[::-1]
            j, j2 = int(order[0]), int(order[1])
            top, second = float(sims[i][j]), float(sims[i][j2])
            # 저확신(절대값 낮음) 또는 애매(1·2위 차 작음)하면 배정 안 함 → 미분류(review)
            if top < EMBED_MIN_CONF or (top - second) < EMBED_MIN_MARGIN:
                continue
            result[tag] = (AXES[j], top, "embed")
    except Exception as e:
        print(f"  [embed] 생략됨 (모델 사용 불가: {e})")
        print("         → 미분류 태그는 review CSV로 빠집니다. 로컬 GPU에서 재실행하면 임베딩 분류 가능.")
    return result


def load_tags_from_db():
    """팀 MySQL tag 테이블에서 (name, usage_count) 로드."""
    import getpass
    import pymysql
    config = {
        "host": os.environ.get("QUOKKA_DB_HOST", "3.35.156.61"),
        "port": int(os.environ.get("QUOKKA_DB_PORT", "3306")),
        "user": os.environ.get("QUOKKA_DB_USER", "quokka"),
        "password": getpass.getpass("DB 비밀번호 입력: "),
        "database": os.environ.get("QUOKKA_DB_NAME", "quokkatoon"),
        "charset": "utf8mb4",
    }
    conn = pymysql.connect(**config)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT name, usage_count FROM tag")
            rows = cur.fetchall()
    finally:
        conn.close()
    return [(r[0], int(r[1]) if r[1] is not None else 0) for r in rows]


def load_tags_from_csv(path):
    tags = []
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("name") or row.get("태그") or "").strip()
            if not name:
                continue
            uc = row.get("usage_count") or row.get("사용수") or "0"
            try:
                uc = int(float(uc))
            except ValueError:
                uc = 0
            tags.append((name, uc))
    return tags


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", help="tag CSV (name,usage_count). 없으면 DB에서 읽음")
    ap.add_argument("--no-embed", action="store_true", help="임베딩 단계 생략")
    args = ap.parse_args()

    seed = load_seed()
    print(f"[시드] {len(seed)}개 태그 로드")

    if args.csv:
        tags = load_tags_from_csv(args.csv)
        print(f"[CSV] {len(tags)}개 태그 로드: {args.csv}")
    else:
        tags = load_tags_from_db()
        print(f"[DB] {len(tags)}개 태그 로드")

    usage = {name: uc for name, uc in tags}
    all_names = [name for name, _ in tags]

    # 필터/메타 태그를 radar_token으로 정규화: 순수필터→제외, 완결로맨스→로맨스
    # + 노이즈 태그(공모전·추천작·작화평 등)도 제외
    tokens, seen, excluded = [], set(), []
    for t in all_names:
        rt = radar_token(t)
        if rt is None or is_noise(rt):
            excluded.append(t)
        elif rt not in seen:
            seen.add(rt)
            tokens.append(rt)
    all_names = tokens
    if excluded:
        print(f"[제외] 순수 필터 태그 {len(excluded)}개 (완결/무료/19금/드라마화 등) → serial_status 등 필터용")

    assigned = {}   # tag -> (axis, conf, method)

    # 1) SEED
    for t in all_names:
        if t in seed:
            assigned[t] = (seed[t], 1.00, "seed")

    # 2) RULE
    for t in all_names:
        if t in assigned:
            continue
        r = classify_by_rule(t)
        if r:
            assigned[t] = r

    # 3) EMBED (남은 것)
    unresolved = [t for t in all_names if t not in assigned]
    if unresolved and not args.no_embed:
        emb = classify_by_embedding(unresolved)
        assigned.update(emb)

    # 4) REVIEW 대상: 미분류 + confidence 낮은 것
    review_rows = []
    axis_lists = {ax: [] for ax in AXES}
    for t in all_names:
        if t in assigned:
            ax, conf, method = assigned[t]
            axis_lists[ax].append(t)
            # 규칙/임베딩 결과 중 확신 낮은 건 검수 목록에도 추가
            if method != "seed" and conf < 0.55:
                review_rows.append((t, usage.get(t, 0), ax, method, round(conf, 3)))
        else:
            review_rows.append((t, usage.get(t, 0), "미분류", "none", 0.0))

    # ---- 산출물 저장 ----
    out = {
        "_comment": "expand_axis_map.py 자동 생성. 시드+규칙+임베딩 캐스케이드. review CSV로 저확신 태그 보정 후 사용.",
        "_axes": AXES,
    }
    for ax in AXES:
        # 중복 제거 + usage 높은 순 정렬
        uniq = sorted(set(axis_lists[ax]), key=lambda x: -usage.get(x, 0))
        out[ax] = uniq
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    review_rows.sort(key=lambda r: (-r[1]))   # 많이 쓰인 태그부터 검수
    with open(REVIEW_PATH, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["tag", "usage_count", "assigned_axis", "method", "confidence"])
        w.writerows(review_rows)

    # ---- 리포트 ----
    method_count = {}
    for t in all_names:
        m = assigned.get(t, (None, 0, "none"))[2].split(":")[0]
        method_count[m] = method_count.get(m, 0) + 1

    print("\n=== 분류 결과 ===")
    print(f"  전체 태그: {len(all_names)}개")
    for m in ["seed", "rule", "embed", "none"]:
        if m in method_count:
            print(f"    {m:6}: {method_count[m]}개")
    print("\n  축별 태그 수:")
    for ax in AXES:
        print(f"    {ax:4}: {len(out[ax])}개")
    print(f"\n  검수 필요(review CSV): {len(review_rows)}개")
    print(f"\n[저장] {OUT_PATH}")
    print(f"[저장] {REVIEW_PATH}")
    print("\n다음: review CSV에서 미분류/저확신 태그 축 보정 → axis_map_expanded.json 반영 → build_radar.py 재실행")


if __name__ == "__main__":
    main()
