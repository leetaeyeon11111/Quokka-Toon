"""
쿼카툰 - 필터 메타 공용 모듈 (D의 radar 제외 + A의 검색 필터가 함께 사용)
=======================================================================
목적:
  '완결/연재중', '19금/전연령', '드라마화/애니화' 같은 필터성 태그를 한 곳에서 정의.
  - D(build_radar/axis_map): 이 태그들을 radar 축에서 '제외'하는 기준으로 사용
  - A(검색 필터): 이 태그들로 웹툰의 serial_status/age_rating/media_mix를 '추출'하고
                  자연어 쿼리에서 필터 조건을 '파싱'하는 기준으로 사용
  → D와 A가 같은 어휘를 공유해 서로 어긋나지 않게 한다.

이 모듈은 순수 파이썬(외부 의존성 없음)이라 어디서든 import 가능.
"""
import re

# ---------------------------------------------------------------------------
# 1) 필터 태그 어휘 (webtoon_tag에 실제로 붙는 태그명 기준)
# ---------------------------------------------------------------------------

# 연재상태: '완결*' 접두 태그(완결로맨스, 완결드라마 …)가 완결 신호.
STATUS_PREFIX = ("완결",)                         # startswith 로 검사
STATUS_EXACT = {
    "완결": "완결", "완결작": "완결", "완결됨": "완결",
    "연재중": "연재중", "연재": "연재중", "연재작": "연재중",
    "휴재": "휴재",
}

# 이용가: 성인/전연령
AGE_EXACT = {
    "19금": "19금", "성인": "19금", "성인물": "19금", "청소년이용불가": "19금",
    "전연령": "전연령", "전체이용가": "전연령", "전체이용": "전연령",
}

# 미디어믹스: 영상화 여부
MEDIA_EXACT = {
    "드라마화": "드라마화", "드라마원작": "드라마화",
    "애니화": "애니화", "애니메이션화": "애니화",
    "영화화": "영화화", "게임화": "게임화",
}

# 가격(선택적 필터): 무료/유료
PRICE_EXACT = {"무료": "무료", "완결무료": "무료", "유료": "유료"}


def filter_dimension_of(tag):
    """
    태그가 어떤 필터 차원에 속하는지 판정.
    반환: (dimension, value) 또는 None
      dimension ∈ {serial_status, age_rating, media_mix, price}
    """
    if tag in STATUS_EXACT:
        return "serial_status", STATUS_EXACT[tag]
    if any(tag.startswith(p) for p in STATUS_PREFIX):   # 완결로맨스 등
        return "serial_status", "완결"
    if tag in AGE_EXACT:
        return "age_rating", AGE_EXACT[tag]
    if tag in MEDIA_EXACT:
        return "media_mix", MEDIA_EXACT[tag]
    if tag in PRICE_EXACT:
        return "price", PRICE_EXACT[tag]
    return None


def is_filter_tag(tag):
    """radar 축에서 제외해야 하는 필터성 태그인가? (D가 사용)"""
    return filter_dimension_of(tag) is not None


def radar_token(tag):
    """
    radar 축 매칭용 태그 정규화. (build_radar가 사용)
      '완결로맨스' → '로맨스'  (완결 접두 제거, 내용부 살림 → 장르 신호 보존)
      '완결무료'   → None      (완결 떼면 '무료' = 순수 필터)
      '완결'/'연재중'/'19금'/'드라마화'/'무료' → None  (순수 필터, radar 기여 없음)
      그 외 → 태그 그대로
    → 웹툰 태그를 이 함수로 정규화+중복제거 후 축 매칭하면
      '완결*'만 붙은 웹툰도 장르 점수를 잃지 않고, 기본 태그와 중복 계산도 안 됨.
    """
    for p in STATUS_PREFIX:
        if tag.startswith(p) and tag != p:      # 완결로맨스 등 복합태그
            rem = tag[len(p):]
            if filter_dimension_of(rem) is not None:   # 완결무료 → 무료(필터) → 버림
                return None
            return rem or None
    if filter_dimension_of(tag) is not None:    # 완결/연재중/19금/드라마화/무료 등 순수 필터
        return None
    return tag


def normalize_tags_for_radar(tags):
    """태그 리스트 → radar용 정규화 토큰(중복 제거, 순서 보존)."""
    seen, out = set(), []
    for t in tags:
        rt = radar_token(t)
        if rt and rt not in seen:
            seen.add(rt)
            out.append(rt)
    return out


def derive_filters(tags):
    """
    웹툰의 태그 리스트 → 필터 메타 추출. (A가 사용, 재임베딩 때 meta에 baking)
    반환 예: {'serial_status':'완결', 'age_rating':'전연령', 'media_mix':['드라마화']}
    단일값 차원(serial_status/age_rating/price)은 하나로, media_mix는 여러 개 가능.
    """
    out = {"serial_status": None, "age_rating": None, "media_mix": [], "price": None}
    for t in tags:
        dv = filter_dimension_of(t)
        if not dv:
            continue
        dim, val = dv
        if dim == "media_mix":
            if val not in out["media_mix"]:
                out["media_mix"].append(val)
        else:
            # 이미 값이 있으면 완결>연재중 등 우선순위 없이 '처음 값 유지'
            if out[dim] is None:
                out[dim] = val
    return out


# ---------------------------------------------------------------------------
# 2) 자연어 쿼리 파싱 (A가 사용)
#    "완결된 짜릿한 액션" → filters={serial_status:완결}, content="짜릿한 액션"
# ---------------------------------------------------------------------------

# (정규식, dimension, value). 쿼리에서 이 표현이 보이면 필터로 잡고 문장에서 제거.
# 조사/어미(된/난/인/되는/로 나온 …)까지 함께 지워 content가 깔끔하게 남게 함.
QUERY_PATTERNS = [
    (r"완결\s*(된|난|작|됐|되었)?", "serial_status", "완결"),
    (r"연재\s*(중인|중|하는)?", "serial_status", "연재중"),
    (r"(19금|성인물|성인용|성인)", "age_rating", "19금"),
    (r"(전연령|전체\s*이용가?|건전한)", "age_rating", "전연령"),
    (r"드라마\s*(화된|화|로\s*나온|로\s*만든|원작)", "media_mix", "드라마화"),
    (r"애니\s*(메이션)?\s*(화된|화|로\s*나온)", "media_mix", "애니화"),
    (r"영화\s*(화된|화|로\s*나온)", "media_mix", "영화화"),
    (r"무료", "price", "무료"),
]


def parse_query(text):
    """
    자연어 쿼리 → (filters, content_query)
      filters: {dimension: value 또는 media_mix 리스트}
      content_query: 필터 표현을 제거한 의미검색용 문장
    """
    filters = {}
    remaining = text
    for pat, dim, val in QUERY_PATTERNS:
        if re.search(pat, remaining):
            if dim == "media_mix":
                filters.setdefault("media_mix", [])
                if val not in filters["media_mix"]:
                    filters["media_mix"].append(val)
            else:
                filters.setdefault(dim, val)
            remaining = re.sub(pat, " ", remaining)
    content = re.sub(r"\s+", " ", remaining).strip()
    return filters, content


def match_filters(webtoon_filters, query_filters):
    """
    웹툰의 필터 메타가 쿼리 필터 조건을 모두 만족하는가? (A가 검색 후 적용)
      webtoon_filters: derive_filters() 결과
      query_filters  : parse_query() 결과의 filters
    serial_status가 None(미상)인 웹툰은 완결/연재중 조건에서 탈락시키지 않음(보수적).
    """
    for dim, want in query_filters.items():
        have = webtoon_filters.get(dim)
        if dim == "media_mix":
            have = have or []
            if not all(w in have for w in want):
                return False
        else:
            if have is None:
                # 메타 미상 → 필터로 걸러내지 않음(리콜 우선). 엄격히 하려면 False로.
                continue
            if have != want:
                return False
    return True
