"""
쿼카툰 - 오각 레이더(radar_json) 생성  [정규화 패치본]
웹툰 태그 → 5축(장르/테마/감성/캐릭터/배경) 점수

점수 로직:
  base(태그 있으면 50) + 개수보너스(개당 +12, 최대 +30)
                       + 희귀도보너스(희귀할수록 +, 최대 +20)
  → 0~100 클램핑
  크기보정 계수 = 1.0 (인기 데이터 쌓이면 활성화)

[변경점] 태그를 filter_meta.normalize_tags_for_radar로 정규화한 뒤 축 매칭:
  - '완결로맨스' → '로맨스'  (완결작도 장르 신호 유지)
  - '완결무료'/'연재중'/'19금'/'드라마화' → 제거 (순수 필터)
  - 중복 제거 (완결로맨스 + 로맨스 → 로맨스 하나)

실행:
  python build_radar.py  → DB 비밀번호 입력 → radar_json 생성 → models/webtoon_radar.pkl
"""
import getpass
import json
import os
import pickle
import pandas as pd
import pymysql

from filter_meta import normalize_tags_for_radar   # [추가] 완결 정규화

AXES = ["장르", "테마", "감성", "캐릭터", "배경"]
HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("QUOKKA_DATA_DIR", os.path.join(HERE, "data"))
MODELS_DIR = os.environ.get("QUOKKA_MODELS_DIR", os.path.join(HERE, "..", "models"))

with open(os.path.join(DATA_DIR, 'axis_map.json'), encoding='utf-8') as f:
    _m = json.load(f)
    AXIS_MAP = {ax: set(_m[ax]) for ax in AXES}


def get_connection():
    pw = os.environ.get('QUOKKA_DB_PASSWORD')
    if pw is None:
        pw = getpass.getpass('DB 비밀번호 입력: ')
    return pymysql.connect(
        host=os.environ.get('QUOKKA_DB_HOST', '127.0.0.1'),
        port=int(os.environ.get('QUOKKA_DB_PORT', '3306')),
        user=os.environ.get('QUOKKA_DB_USER', 'quokka'),
        password=pw,
        database=os.environ.get('QUOKKA_DB_NAME', 'quokkatoon'),
        charset='utf8mb4',
    )


def load_tag_usage(conn):
    """태그별 usage_count → 희귀도 계산용"""
    df = pd.read_sql("SELECT name, usage_count FROM tag", conn)
    return dict(zip(df['name'], df['usage_count']))


def load_webtoon_tags(conn):
    """태그 있는 웹툰 + 태그 리스트"""
    sql = """
    SELECT w.webtoon_id, w.title,
        (SELECT GROUP_CONCAT(t.name SEPARATOR ',')
         FROM webtoon_tag wt JOIN tag t ON wt.tag_id = t.tag_id
         WHERE wt.webtoon_id = w.webtoon_id) AS tags
    FROM webtoon w
    WHERE EXISTS (SELECT 1 FROM webtoon_tag wt WHERE wt.webtoon_id = w.webtoon_id)
    """
    df = pd.read_sql(sql, conn)
    df = df.drop_duplicates('webtoon_id').reset_index(drop=True)
    return df


def rarity_bonus(tag, usage_map, max_usage):
    """희귀할수록 높은 보너스 (0~20)"""
    u = usage_map.get(tag, 1)
    ratio = 1 - (u / max_usage)   # 0(흔함)~1(희귀)
    return ratio * 20


def build_radar(tags_str, usage_map, max_usage, size_factor=1.0):
    """태그 리스트 → 5축 radar_json"""
    if not tags_str:
        return None
    raw = [t.strip() for t in str(tags_str).split(',') if t.strip()]
    tags = normalize_tags_for_radar(raw)   # [추가] 완결로맨스→로맨스, 순수필터 제거, 중복제거
    if not tags:
        return None

    radar = {}
    for axis in AXES:
        axis_tags = [t for t in tags if t in AXIS_MAP[axis]]
        if not axis_tags:
            radar[axis] = 20  # 해당 태그 없음
            continue
        base = 50
        count_bonus = min(len(axis_tags) * 12, 30)
        rarity = max(rarity_bonus(t, usage_map, max_usage) for t in axis_tags)
        score = base + count_bonus + rarity
        score = min(100, max(0, score)) * size_factor
        radar[axis] = round(score)
    return radar


def main():
    conn = get_connection()
    print('[1/3] 태그/웹툰 로드')
    usage_map = load_tag_usage(conn)
    max_usage = max(usage_map.values()) if usage_map else 1
    df = load_webtoon_tags(conn)
    conn.close()
    print(f'      태그 있는 웹툰: {len(df):,}개')
    print(f'      태그 종류: {len(usage_map):,}개')

    print('[2/3] radar 생성')
    df['radar'] = df['tags'].apply(
        lambda t: build_radar(t, usage_map, max_usage)
    )
    valid = df['radar'].notna().sum()
    print(f'      radar 생성: {valid:,}개')

    print('[3/3] 저장 (pickle)')
    radar_data = {
        row['webtoon_id']: row['radar']
        for _, row in df.iterrows() if row['radar']
    }
    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(os.path.join(MODELS_DIR, 'webtoon_radar.pkl'), 'wb') as f:
        pickle.dump(radar_data, f)
    print(f'      저장: models/webtoon_radar.pkl ({len(radar_data):,}개)')

    print()
    print('=== 샘플 radar (5개) ===')
    for _, row in df[df['radar'].notna()].head(5).iterrows():
        r = row['radar']
        bars = ' '.join(f'{ax}:{r[ax]}' for ax in AXES)
        print(f'  [{row["title"][:20]}] {bars}')


if __name__ == '__main__':
    main()
