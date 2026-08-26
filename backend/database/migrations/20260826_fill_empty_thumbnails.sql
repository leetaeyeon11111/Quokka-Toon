-- Fill empty/broken thumbnails (2026-08-26)
-- 1) 히든 직업 갬블러로 인생 역전: Kakao Page CDN (user-provided)
-- 2) Other empty/placeholder/relative rows were updated via platform og:image / Naver API
--    in a one-off Python pass against collaboration MySQL (not fully reproducible here).

UPDATE webtoon
SET
  thumbnail_url_original = COALESCE(NULLIF(thumbnail_url_original, ''), thumbnail_url),
  thumbnail_url = 'https://page-images.kakaoentcdn.com/download/resource?kid=BrYWy/dJMcaakupig/NbKkyTmgwBrymavz1ewcNk&filename=o1/dims/resize/384',
  updated_at = NOW()
WHERE webtoon_id = 5085
  AND title = '히든 직업 갬블러로 인생 역전';
