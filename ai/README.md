# 쿼카툰 임베딩 + 검색 (Day 2)

## 폴더 구조 (기존 quokkatoon 폴더에 합치기)
```
quokkatoon/
├── data/slang_dict.json      (이미 있음)
├── nlp/build_embedding.py    ← 신규
├── recommend/search.py       ← 신규
└── models/                   (자동 생성됨)
```

## 실행 순서

### 1. 패키지 (없으면)
```bash
pip install pymysql
```

### 2. 임베딩 + FAISS 구축
```bash
cd nlp
python build_embedding.py
# → DB 비밀번호 입력
# → 팀 DB에서 줄거리+태그 읽기
# → KoSimCSE 임베딩 (GPU 1~3분)
# → models/webtoon_index.faiss 생성
```

### 3. 검색 테스트
```bash
cd recommend
python search.py
# → 검색어 입력
# 예: "복수하는 로맨스", "회귀물 판타지"
```

## 핵심 로직
- JOIN 뻥튀기 해결: GROUP_CONCAT으로 웹툰당 1행
- 임베딩 입력 = 줄거리(신조어 힌트) + 태그
- kmas 우선 정렬 (추천 결과 노출)
- 매칭 태그 = 검색 근거 (왜 추천됐는지)

## 검증 포인트
임베딩 후 이런 검색이 잘 되는지 확인:
- "복수 로맨스" → 복수+로맨스 웹툰 상위
- "회귀 판타지" → 회귀물 상위
- "힐링 일상" → 잔잔한 일상물 상위
