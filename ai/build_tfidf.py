"""Build a fast CPU-friendly Korean character n-gram recommendation index."""

import getpass
import os
import pickle

import joblib
import numpy as np
import pandas as pd
import pymysql
from sklearn.feature_extraction.text import TfidfVectorizer


HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(HERE)
MODELS_DIR = os.environ.get("QUOKKA_MODELS_DIR", os.path.join(PROJECT_ROOT, "models"))


def get_connection():
    password = os.environ.get("QUOKKA_DB_PASSWORD")
    if password is None:
        password = getpass.getpass("DB 비밀번호 입력: ")
    return pymysql.connect(
        host=os.environ.get("QUOKKA_DB_HOST", "127.0.0.1"),
        port=int(os.environ.get("QUOKKA_DB_PORT", "3306")),
        user=os.environ.get("QUOKKA_DB_USER", "quokka"),
        password=password,
        database=os.environ.get("QUOKKA_DB_NAME", "quokkatoon"),
        charset="utf8mb4",
    )


def fetch_webtoons(connection):
    sql = """
    SELECT
        w.webtoon_id, w.title, w.source, w.summary, w.main_genre_id,
        (SELECT GROUP_CONCAT(DISTINCT t.name SEPARATOR ',')
         FROM webtoon_tag wt JOIN tag t ON wt.tag_id = t.tag_id
         WHERE wt.webtoon_id = w.webtoon_id) AS tags
    FROM webtoon w
    WHERE w.summary IS NOT NULL AND w.summary != ''
    """
    frame = pd.read_sql(sql, connection)
    return frame.drop_duplicates(subset="webtoon_id", keep="first").reset_index(drop=True)


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("[1/3] DB 데이터 로드")
    connection = get_connection()
    try:
        frame = fetch_webtoons(connection)
    finally:
        connection.close()

    texts = (
        frame["title"].fillna("") + " "
        + frame["summary"].fillna("") + " "
        + frame["tags"].fillna("").str.replace(",", " ", regex=False)
    ).tolist()
    print(f"      웹툰: {len(frame):,}개")

    print("[2/3] 한국어 문자 n-gram TF-IDF 색인")
    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 3),
        min_df=2,
        max_features=30000,
        sublinear_tf=True,
        norm="l2",
        dtype=np.float32,
    )
    matrix = vectorizer.fit_transform(texts)
    joblib.dump(
        {"vectorizer": vectorizer, "matrix": matrix},
        os.path.join(MODELS_DIR, "webtoon_tfidf.joblib"),
        compress=3,
    )

    print("[3/3] 검색 메타데이터 저장")
    meta = {
        "webtoon_ids": frame["webtoon_id"].tolist(),
        "titles": frame["title"].tolist(),
        "sources": frame["source"].tolist(),
        "summaries": frame["summary"].tolist(),
        "tags": frame["tags"].where(frame["tags"].notna(), None).tolist(),
        "genre_ids": frame["main_genre_id"].tolist(),
    }
    with open(os.path.join(MODELS_DIR, "webtoon_meta.pkl"), "wb") as file:
        pickle.dump(meta, file)
    print(f"완료: {matrix.shape[0]:,}개 × {matrix.shape[1]:,}특성")


if __name__ == "__main__":
    main()
