-- 검색 기록: AI / 일반 모드를 분리해 조회·삭제할 수 있도록 인덱스를 보강한다.
-- search_mode 컬럼이 없는 구버전 DB 를 위한 방어적 추가도 포함한다.

ALTER TABLE search_history
  MODIFY COLUMN search_mode ENUM('NORMAL', 'AI') NOT NULL DEFAULT 'NORMAL';

-- 기존 (user_id, searched_at) 만으로는 모드별 최근 검색이 비효율적이라 복합 인덱스 추가
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'search_history'
    AND index_name = 'idx_history_user_mode_searched'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX idx_history_user_mode_searched ON search_history (user_id, search_mode, searched_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
