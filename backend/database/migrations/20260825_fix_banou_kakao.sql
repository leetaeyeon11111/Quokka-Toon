-- 반왕(webtoon_id=15791) 메타·플랫폼·작가·태그 보정
-- 레진 검색 URL → 카카오페이지 딥링크, 연령 15세, 글/그림 작가 분리, 키워드 태그 연결

START TRANSACTION;

-- 1) 웹툰 본문
UPDATE webtoon
SET
  platform_id = 2,  -- 카카오페이지
  external_url = 'https://page.kakao.com/content/65502271/',
  age_rating = '15',
  age_grade_raw = '15세이용가',
  publisher = 'DCW',
  original_title = 'BANOU',
  summary = '영원한 생명을 주체 못하던 흡혈귀, 츠키야마가 만난 ''장기''. 장기의 심오함에 매료된 그는 300년에 걸쳐 압도적인 기력(棋力)을 손에 넣었다. 인간 사회에서 정체를 숨겨 온 츠키야마였지만, 다니던 장기 교실을 구하기 위해 기전의 최고봉 용왕전에 도전하게 되는데! 범재 흡혈귀 VS 천재 장기 기사. 장기계를 뒤흔드는 싸움의 막이 열린다! BANOU © 2022 by Toshiya Watahiki, Akinaigaraku/SHUEISHA Inc.',
  updated_at = CURRENT_TIMESTAMP
WHERE webtoon_id = 15791;

-- 2) 글 작가: 와타히키 토시야 (없으면 생성)
INSERT INTO author (name, created_at, updated_at)
SELECT '와타히키 토시야', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM author WHERE name = '와타히키 토시야');

-- 3) 작가 연결 정리 후 재설정 (글=와타히키, 그림=아키나이가라쿠)
DELETE FROM webtoon_author WHERE webtoon_id = 15791;

INSERT INTO webtoon_author (webtoon_id, author_id, role, created_at, updated_at)
SELECT 15791, a.author_id, 'WRITER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM author a
WHERE a.name = '와타히키 토시야'
ORDER BY a.author_id
LIMIT 1;

INSERT INTO webtoon_author (webtoon_id, author_id, role, created_at, updated_at)
SELECT 15791, a.author_id, 'ARTIST', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM author a
WHERE a.name = '아키나이가라쿠'
ORDER BY a.author_id
LIMIT 1;

-- 4) 플랫폼 링크: 레진(검색 폴백) 제거 → 카카오페이지 primary
DELETE FROM webtoon_platform WHERE webtoon_id = 15791;

INSERT INTO webtoon_platform (webtoon_id, platform_id, watch_url, is_primary, created_at, updated_at)
VALUES (15791, 2, 'https://page.kakao.com/content/65502271/', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5) 키워드 태그 연결 (#게임 #천재 #노력 #성장 #고인물)
INSERT IGNORE INTO webtoon_tag (webtoon_id, tag_id, created_at, updated_at, source)
SELECT 15791, t.tag_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'manual'
FROM tag t
WHERE t.name IN ('게임', '천재', '노력', '성장', '고인물');

-- 장르(판타지)는 이미 연결되어 있으면

COMMIT;

-- 네이버시리즈 바로가기 추가 (primary는 카카오페이지 유지)
INSERT INTO webtoon_platform (webtoon_id, platform_id, watch_url, is_primary, created_at, updated_at)
VALUES (15791, 3, 'https://series.naver.com/comic/detail.series?productNo=11852446', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  watch_url = VALUES(watch_url),
  is_primary = VALUES(is_primary),
  updated_at = CURRENT_TIMESTAMP;
