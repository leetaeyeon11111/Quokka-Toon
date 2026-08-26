-- Quokka-Toon 최근 7일 핫 랭킹 (MySQL 8, safely re-runnable).
-- 실제 조회는 일 사용자·작품별 1회만 기록하고, 발표용 초기 통계는 7일이 지나면
-- 랭킹 집계 범위에서 자연스럽게 제외된다.

CREATE TABLE IF NOT EXISTS `webtoon_view_event` (
  `view_event_id` bigint NOT NULL AUTO_INCREMENT,
  `webtoon_id` bigint NOT NULL,
  `viewer_key` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `view_date` date NOT NULL,
  `viewed_at` datetime(6) NOT NULL,
  PRIMARY KEY (`view_event_id`),
  UNIQUE KEY `uq_webtoon_viewer_day` (`webtoon_id`, `viewer_key`, `view_date`),
  KEY `idx_webtoon_view_recent` (`viewed_at`, `webtoon_id`),
  CONSTRAINT `fk_view_event_webtoon`
    FOREIGN KEY (`webtoon_id`) REFERENCES `webtoon` (`webtoon_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webtoon_hot_seed` (
  `hot_seed_id` bigint NOT NULL AUTO_INCREMENT,
  `webtoon_id` bigint NOT NULL,
  `stat_date` date NOT NULL,
  `unique_views` int NOT NULL DEFAULT 0,
  `review_count` int NOT NULL DEFAULT 0,
  `review_like_count` int NOT NULL DEFAULT 0,
  `source` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BOOTSTRAP',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`hot_seed_id`),
  UNIQUE KEY `uq_hot_seed_work_date_source` (`webtoon_id`, `stat_date`, `source`),
  KEY `idx_hot_seed_recent` (`stat_date`, `webtoon_id`),
  CONSTRAINT `fk_hot_seed_webtoon`
    FOREIGN KEY (`webtoon_id`) REFERENCES `webtoon` (`webtoon_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 리뷰가 충분히 확인된 실제 작품 16개에 D-6 ~ D-1 통계를 한 번만 넣는다.
-- source=BOOTSTRAP 으로 추적 가능하며, 쿼리는 최근 7일만 읽으므로 재삭제 작업이 없어도 된다.
INSERT INTO `webtoon_hot_seed`
  (`webtoon_id`, `stat_date`, `unique_views`, `review_count`, `review_like_count`, `source`)
SELECT
  ranked.webtoon_id,
  DATE_SUB(DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 9 HOUR)), INTERVAL days.day_offset DAY),
  GREATEST(3, 22 - ranked.seed_rank + MOD(days.day_offset * 3 + ranked.seed_rank, 5)),
  CASE
    WHEN ranked.seed_rank = 1 THEN 1 + MOD(days.day_offset, 2)
    WHEN ranked.seed_rank <= 8 AND MOD(days.day_offset + ranked.seed_rank, 3) = 0 THEN 1
    WHEN ranked.seed_rank > 8 AND MOD(days.day_offset + ranked.seed_rank, 5) = 0 THEN 1
    ELSE 0
  END,
  GREATEST(0, 5 - FLOOR((ranked.seed_rank - 1) / 4) + MOD(days.day_offset + ranked.seed_rank, 3)),
  'BOOTSTRAP'
FROM (
  SELECT 24523 AS webtoon_id, 1 AS seed_rank UNION ALL
  SELECT 24122, 2 UNION ALL
  SELECT 28839, 3 UNION ALL
  SELECT 24121, 4 UNION ALL
  SELECT 24772, 5 UNION ALL
  SELECT 25647, 6 UNION ALL
  SELECT 29589, 7 UNION ALL
  SELECT 23854, 8 UNION ALL
  SELECT 23852, 9 UNION ALL
  SELECT 23857, 10 UNION ALL
  SELECT 25063, 11 UNION ALL
  SELECT 24145, 12 UNION ALL
  SELECT 24675, 13 UNION ALL
  SELECT 28656, 14 UNION ALL
  SELECT 23942, 15 UNION ALL
  SELECT 37947, 16
) ranked
JOIN `webtoon` w ON w.webtoon_id = ranked.webtoon_id
CROSS JOIN (
  SELECT 1 AS day_offset UNION ALL SELECT 2 UNION ALL SELECT 3
  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) days
WHERE NOT EXISTS (
  SELECT 1 FROM `webtoon_hot_seed` existing WHERE existing.source = 'BOOTSTRAP'
);
