-- Quokka-Toon level/EXP ledger migration (MySQL 8, safely re-runnable).
-- Apply to the existing quokkatoon schema before starting the updated backend.

ALTER TABLE `user_level_log`
  MODIFY COLUMN `action_type`
    enum('POST','COMMENT','REVIEW','VISIT','VISIT_STREAK','RECOMMEND','NOT_RECOMMEND','REPORTED')
    COLLATE utf8mb4_unicode_ci NOT NULL;

DROP PROCEDURE IF EXISTS add_level_column;
DELIMITER $$
CREATE PROCEDURE add_level_column(IN column_name_value varchar(64), IN definition_value text)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'user_level_log'
      AND column_name = column_name_value
  ) THEN
    SET @statement_value = CONCAT('ALTER TABLE `user_level_log` ADD COLUMN ', definition_value);
    PREPARE level_statement FROM @statement_value;
    EXECUTE level_statement;
    DEALLOCATE PREPARE level_statement;
  END IF;
END$$
DELIMITER ;

CALL add_level_column('entry_type',
  '`entry_type` enum(''EARN'',''REVERSAL'') NOT NULL DEFAULT ''EARN'' AFTER `action_type`');
CALL add_level_column('actor_user_id',
  '`actor_user_id` bigint NULL AFTER `ref_id`');
CALL add_level_column('event_key',
  '`event_key` varchar(191) COLLATE utf8mb4_unicode_ci NULL AFTER `actor_user_id`');
CALL add_level_column('original_log_id',
  '`original_log_id` bigint NULL AFTER `event_key`');
CALL add_level_column('activity_date',
  '`activity_date` date NULL AFTER `original_log_id`');

UPDATE `user_level_log`
SET `event_key` = CONCAT('LEGACY:', `log_id`)
WHERE `event_key` IS NULL;

UPDATE `user_level_log`
SET `activity_date` = DATE(`created_at`)
WHERE `activity_date` IS NULL;

ALTER TABLE `user_level_log`
  MODIFY COLUMN `event_key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN `activity_date` date NOT NULL;

DROP PROCEDURE IF EXISTS add_level_index;
DELIMITER $$
CREATE PROCEDURE add_level_index(IN index_name_value varchar(64), IN definition_value text)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'user_level_log'
      AND index_name = index_name_value
  ) THEN
    SET @statement_value = CONCAT('ALTER TABLE `user_level_log` ADD ', definition_value);
    PREPARE level_statement FROM @statement_value;
    EXECUTE level_statement;
    DEALLOCATE PREPARE level_statement;
  END IF;
END$$
DELIMITER ;

CALL add_level_index('uq_levellog_event', 'UNIQUE KEY `uq_levellog_event` (`event_key`)');
CALL add_level_index('uq_levellog_reversal', 'UNIQUE KEY `uq_levellog_reversal` (`original_log_id`)');
CALL add_level_index('idx_levellog_user_date', 'KEY `idx_levellog_user_date` (`user_id`,`activity_date`)');
CALL add_level_index('idx_levellog_user_action_date',
  'KEY `idx_levellog_user_action_date` (`user_id`,`action_type`,`activity_date`)');
CALL add_level_index('idx_levellog_actor', 'KEY `idx_levellog_actor` (`actor_user_id`)');

DROP PROCEDURE IF EXISTS add_level_constraint;
DELIMITER $$
CREATE PROCEDURE add_level_constraint(IN constraint_name_value varchar(64), IN definition_value text)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = DATABASE() AND table_name = 'user_level_log'
      AND constraint_name = constraint_name_value
  ) THEN
    SET @statement_value = CONCAT('ALTER TABLE `user_level_log` ADD CONSTRAINT ', definition_value);
    PREPARE level_statement FROM @statement_value;
    EXECUTE level_statement;
    DEALLOCATE PREPARE level_statement;
  END IF;
END$$
DELIMITER ;

CALL add_level_constraint('fk_levellog_actor',
  '`fk_levellog_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL');
CALL add_level_constraint('fk_levellog_original',
  '`fk_levellog_original` FOREIGN KEY (`original_log_id`) REFERENCES `user_level_log` (`log_id`)');

DROP PROCEDURE IF EXISTS add_level_constraint;
DROP PROCEDURE IF EXISTS add_level_index;
DROP PROCEDURE IF EXISTS add_level_column;
