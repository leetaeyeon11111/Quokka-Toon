"""
쿼카툰 - 신규 웹툰 자동 반영 파이프라인
전체 재구축 없이 신규/변경분만 추가

로직:
  1. DB에서 현재 웹툰 목록 조회
  2. 기존 인덱스(meta)에 없는 신규 webtoon_id 찾기
  3. 신규만 임베딩 → FAISS.add
  4. 신규만 radar 생성
  5. meta / radar 캐시 업데이트

실행:
  python update_pipeline.py
  → 신규 있으면 추가, 없으면 스킵

cron 예시 (매일 새벽 3시):
  0 3 * * * cd /path/quokkatoon/recommend && python update_pipeline.py
"""
import getpass
import json
import pickle
import pandas as pd
import numpy as np
import pymysql
from sentence_transformers import SentenceTransformer
import faiss

MODEL_NAME = 'BM-K/KoSimCSE-roberta-multitask'
AXES = ["장르", "테마", "감성", "캐릭터", "배경"]

with open('../data/slang_dict.json', encoding='utf-8') as f:
    SLANG = json.load(f)
with open('../data/axis_map.json', encoding='utf-8') as f:
    _m = json.load(f)
    AXIS_MAP = {ax: set(_m[ax]) for ax in AXES}


def get_connection():
    pw = getpass.getpass('DB 비밀번호 입력: ')
    return pymysql.connect(
        host='3.35.156.61', port=3306, user='quokka',
        password=pw, database='quokkatoon', charset='utf8mb4',
    )


def add_slang_hints(text):
    if pd.isna(text) or not str(text).strip():
        return ''
    text = str(text)
    found = [f'{w}={m}' for w, m in SLANG.items() if w in text]
    return f'{text} (관련 키워드: {" / ".join(found)})' if found else text


def build_embed_text(summary, tags):
    parts = []
    o = add_slang_hints(summary)
    if o:
        parts.append(o)
    if tags and str(tags).strip():
        parts.append('태그: ' + str(tags).replace(',', ' '))
    return ' '.join(parts)


def build_radar(tags_str, usage_map, max_usage):
    if not tags_str:
        return None
    tags = [t.strip() for t in str(tags_str).split(',') if t.strip()]
    radar = {}
    for axis in AXES:
        atags = [t for t in tags if t in AXIS_MAP[axis]]
        if not atags:
            radar[axis] = 20
            continue
        base, cb = 50, min(len(atags) * 12, 30)
        rr = max((1 - usage_map.get(t, 1) / max_usage) * 20 for t in atags)
        radar[axis] = round(min(100, base + cb + rr))
    return radar


def main():
    conn = get_connection()

    # 현재 DB 웹툰
    sql = """
    SELECT w.webtoon_id, w.title, w.source, w.summary, w.main_genre_id,
        (SELECT GROUP_CONCAT(t.name SEPARATOR ',')
         FROM webtoon_tag wt JOIN tag t ON wt.tag_id = t.tag_id
         WHERE wt.webtoon_id = w.webtoon_id) AS tags
    FROM webtoon w
    WHERE w.summary IS NOT NULL AND w.summary != ''
    """
    df = pd.read_sql(sql, conn).drop_duplicates('webtoon_id').reset_index(drop=True)
    usage = pd.read_sql("SELECT name, usage_count FROM tag", conn)
    usage_map = dict(zip(usage['name'], usage['usage_count']))
    max_usage = max(usage_map.values()) if usage_map else 1
    conn.close()

    # 기존 인덱스
    index = faiss.read_index('../models/webtoon_index.faiss')
    with open('../models/webtoon_meta.pkl', 'rb') as f:
        meta = pickle.load(f)
    try:
        with open('../models/webtoon_radar.pkl', 'rb') as f:
            radar_cache = pickle.load(f)
    except FileNotFoundError:
        radar_cache = {}

    existing_ids = set(meta['webtoon_ids'])
    new_df = df[~df['webtoon_id'].isin(existing_ids)].reset_index(drop=True)

    if len(new_df) == 0:
        print('신규 웹툰 없음. 종료.')
        return
    print(f'신규 웹툰 {len(new_df):,}개 발견')

    # 신규 임베딩 → add
    model = SentenceTransformer(MODEL_NAME)
    texts = [build_embed_text(r['summary'], r['tags']) for _, r in new_df.iterrows()]
    emb = model.encode(texts, batch_size=128, show_progress_bar=True, convert_to_numpy=True)
    faiss.normalize_L2(emb)
    index.add(emb)
    faiss.write_index(index, '../models/webtoon_index.faiss')

    # meta 업데이트
    for col, key in [('webtoon_id','webtoon_ids'),('title','titles'),
                     ('source','sources'),('summary','summaries'),
                     ('tags','tags'),('main_genre_id','genre_ids')]:
        meta[key].extend(new_df[col].tolist())
    with open('../models/webtoon_meta.pkl', 'wb') as f:
        pickle.dump(meta, f)

    # 신규 radar
    for _, r in new_df.iterrows():
        rd = build_radar(r['tags'], usage_map, max_usage)
        if rd:
            radar_cache[r['webtoon_id']] = rd
    with open('../models/webtoon_radar.pkl', 'wb') as f:
        pickle.dump(radar_cache, f)

    print(f'완료: {len(new_df):,}개 추가')
    print(f'  총 웹툰: {index.ntotal:,}개')
    print(f'  radar: {len(radar_cache):,}개')


if __name__ == '__main__':
    main()
