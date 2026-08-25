-- Quokka-Toon quick_prompt migration (MySQL 8, safely re-runnable).
-- 메인페이지 추천 검색어 버튼(관리자 편집). ddl-auto=validate 이므로 백엔드 기동 전에 적용할 것.

CREATE TABLE IF NOT EXISTS `quick_prompt` (
  `quick_prompt_id` bigint NOT NULL AUTO_INCREMENT,
  `label`      varchar(50)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `query_text` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`quick_prompt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 데이터는 백엔드의 QuickPromptInitializer 가 비어 있을 때 자동으로 채운다.
