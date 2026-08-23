"""
쿼카툰 - 웹툰 임베딩 + FAISS 인덱스 구축 (v3)
48,701개 대응
"""
import getpass
import json
import pickle
import pandas as pd
import numpy as np
import pymysql
from sentence_transformers import SentenceTransformer
import faiss
import os

MODEL_NAME = 'BM-K/KoSimCSE-roberta-multitask'
EMB_DIM = 768

try:
    with open('../data/slang_dict.json', encoding='utf-8') as f:
        SLANG = json.load(f)
except FileNotFoundError:
    SLANG = {}
    print('[경고] slang_dict.json 없음')


def get_connection():
    pw = getpass.getpass('DB 비밀번호 입력: ')
    return pymysql.connect(
        host='3.35.156.61', port=3306, user='quokka',
        password=pw, database='quokkatoon', charset='utf8mb4',
    )


def fetch_webtoons(conn):
    sql = """
    SELECT
        w.webtoon_id, w.title, w.source, w.summary, w.main_genre_id,
        (SELECT GROUP_CONCAT(DISTINCT t.name SEPARATOR ',')
         FROM webtoon_tag wt JOIN tag t ON wt.tag_id = t.tag_id
         WHERE wt.webtoon_id = w.webtoon_id) AS tags
    FROM webtoon w
    WHERE w.summary IS NOT NULL AND w.summary != ''
    """
    df = pd.read_sql(sql, conn)
    df = df.drop_duplicates(subset='webtoon_id', keep='first').reset_index(drop=True)
    return df


def add_slang_hints(text):
    if pd.isna(text) or not str(text).strip():
        return ''
    text = str(text)
    found = [f'{w}={m}' for w, m in SLANG.items() if w in text]
    return f'{text} (관련 키워드: {" / ".join(found)})' if found else text


def build_embed_text(row):
    parts = []
    outline = add_slang_hints(row['summary'])
    if outline:
        parts.append(outline)
    if pd.notna(row['tags']) and str(row['tags']).strip():
        parts.append('태그: ' + str(row['tags']).replace(',', ' '))
    return ' '.join(parts)


def main():
    os.makedirs('../models', exist_ok=True)

    print('[1/5] 팀 DB 접속 + 데이터 로드')
    conn = get_connection()
    df = fetch_webtoons(conn)
    conn.close()
    print(f'      웹툰: {len(df):,}개 (고유 ID)')
    print(f'      태그 있음: {df["tags"].notna().sum():,}개')
    print(f'      소스: {df["source"].value_counts().to_dict()}')

    print('[2/5] 임베딩 입력 생성')
    df['embed_text'] = df.apply(build_embed_text, axis=1)
    print(f'      예시: {df.iloc[0]["embed_text"][:70]}...')

    print(f'[3/5] KoSimCSE 임베딩 ({len(df):,}개, 몇 분 소요)')
    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(
        df['embed_text'].tolist(),
        batch_size=128, show_progress_bar=True, convert_to_numpy=True,
    )
    faiss.normalize_L2(embeddings)
    print(f'      완료: {embeddings.shape}')

    print('[4/5] FAISS 인덱스 구축')
    index = faiss.IndexFlatIP(EMB_DIM)
    index.add(embeddings)
    faiss.write_index(index, '../models/webtoon_index.faiss')
    print(f'      저장: {index.ntotal:,}개')

    print('[5/5] 메타데이터 저장')
    meta = {
        'webtoon_ids': df['webtoon_id'].tolist(),
        'titles': df['title'].tolist(),
        'sources': df['source'].tolist(),
        'summaries': df['summary'].tolist(),
        'tags': df['tags'].tolist(),
        'genre_ids': df['main_genre_id'].tolist(),
    }
    with open('../models/webtoon_meta.pkl', 'wb') as f:
        pickle.dump(meta, f)

    print()
    print('=== 완료 ===')
    print(f'  임베딩: {len(df):,}개')
    print(f'  kmas: {(df["source"]=="kmas").sum():,}개 (추천 우선)')

if __name__ == '__main__':
    main()
