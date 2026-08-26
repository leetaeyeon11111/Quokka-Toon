-- 고스트 바둑왕 메타 교정 + 검은 후드 줄거리 오염 정리 + 투믹스 「고스트」 복구
-- 배경: 병합 과정에서 투믹스 「고스트」 줄거리가 카카오페이지 고스트* 작품들에 잘못 복사됨.

START TRANSACTION;

-- A) 고스트 바둑왕 본편
UPDATE webtoon
SET summary = '어느날 초등학교 6학년인 히카루는 창고에서 오래된 바둑판을 발견한다. 그 순간 바둑판에 봉인되어있던 헤이안 시대의 천재기사 후지와라노 사이의 혼이 히카루의 의식속으로 들어와 버린다. 사이의 바둑을 향한 일편단심 열정이 서서히 히카루를 바둑의 세계로 인도해가는데.',
    updated_at = CURRENT_TIMESTAMP
WHERE webtoon_id = 44901;

DELETE wp FROM webtoon_platform wp
JOIN platform p ON p.platform_id = wp.platform_id
WHERE wp.webtoon_id = 44901 AND p.name = '네이버웹툰';

UPDATE webtoon_platform SET is_primary = 1, updated_at = CURRENT_TIMESTAMP
WHERE webtoon_id = 44901 AND platform_id = 2;

INSERT IGNORE INTO webtoon_tag (webtoon_id, tag_id, created_at, updated_at, source)
SELECT 44901, t.tag_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'manual'
FROM tag t
WHERE t.name IN ('학생','남주중심','이야기중심','스릴 넘치는','일상','성장물','학원물','현대물');

-- B) 고스트 바둑왕 [단행본]
UPDATE webtoon
SET summary = '어느날 초등학교 6학년인 히카루는 창고에서 오래된 바둑판을 발견한다. 그 순간 바둑판에 봉인되어있던 헤이안 시대의 천재기사 후지와라노 사이의 혼이 히카루의 의식속으로 들어와 버린다. 사이의 바둑을 향한 일편단심 열정이 서서히 히카루를 바둑의 세계로 인도해가는데.',
    updated_at = CURRENT_TIMESTAMP
WHERE webtoon_id = 44900;

DELETE wp FROM webtoon_platform wp
JOIN platform p ON p.platform_id = wp.platform_id
WHERE wp.webtoon_id = 44900 AND p.name = '네이버웹툰';

UPDATE webtoon_platform SET is_primary = 1, updated_at = CURRENT_TIMESTAMP
WHERE webtoon_id = 44900 AND platform_id = 2;

DELETE wt FROM webtoon_tag wt
JOIN tag t ON t.tag_id = wt.tag_id
WHERE wt.webtoon_id = 44900
  AND t.name IN ('완결','로맨스','철벽녀','애니메이션화','원나잇','쌍방삽질','막장');

INSERT IGNORE INTO webtoon_tag (webtoon_id, tag_id, created_at, updated_at, source)
SELECT 44900, t.tag_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'manual'
FROM tag t
WHERE t.name IN ('학생','남주중심','이야기중심','스릴 넘치는','일상','성장물','학원물','현대물');

-- C) 오염된 카카오 고스트* 줄거리 비우기 (올바른 원문 로컬에 없음 → NULL)
UPDATE webtoon
SET summary = NULL, updated_at = CURRENT_TIMESTAMP
WHERE webtoon_id IN (33863, 38141, 38410, 38662, 43503, 44416, 44422)
  AND (summary LIKE '%검은 후드%' OR summary IS NULL);

-- D) 투믹스 「고스트」 복구 (협업에 없던 KMAS/투믹스 원본)
INSERT INTO webtoon (
  source, source_key, title, product_name, platform_id, external_url, thumbnail_url,
  main_genre_id, summary, age_rating, age_grade_raw, publisher, episode_count,
  serial_status, is_completed, view_count, bookmark_count, rating_avg, rating_count,
  created_at, updated_at
)
SELECT
  'kmas', '고스트|홍작가|투믹스', '고스트', '고스트', 14,
  'https://www.toomics.com/webtoon/search?keyword=%EA%B3%A0%EC%8A%A4%ED%8A%B8',
  'https://www.kmas.or.kr:443/common/file/atchmnflDownload.ajax?fileImageId=3000263424',
  20,
  "매일 밤, 사람을 죽기 직전까지 구타하고 사라지는 '검은 후드의 남자'. 그리고 어느 날 '검은 후드의 남자'의 첫 살인 사건이 일어난다.  중학생 지원은 놀이터에서 우연히 '검은 후드의 남자'와 마주치고, 그가 '고스트'를 찾아 범행을 저지르고 있었다는 것을 알게 되는데...  '고스트'의 정체는 무엇인가? '검은 후드의 남자'는 왜 '고스트'를 찾으려 하는가? 지원은 한 걸음 두 걸음, 사건 속으로 깊게 파고들어간다.",
  'ALL', '확인필요', NULL, 0, 'ONGOING', 0, 0, 0, 0.00, 0,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM webtoon WHERE platform_id = 14 AND title = '고스트' AND source_key = '고스트|홍작가|투믹스'
);

COMMIT;
