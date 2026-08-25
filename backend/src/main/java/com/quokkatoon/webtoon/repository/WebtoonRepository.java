package com.quokkatoon.webtoon.repository;

import com.quokkatoon.webtoon.entity.Webtoon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WebtoonRepository extends JpaRepository<Webtoon, Long> {

    // 목록 검색: 제목(q)/플랫폼/장르/작가/태그 선택 필터.
    // 제목은 공백을 무시해 '나혼자만 레벨업' ↔ '나 혼자만 레벨업' 같이 매칭한다.
    // 정렬은 Pageable Sort 를 쓰지 않고 :sort 로 처리(native ORDER BY 중복 방지).
    @Query(value = """
            SELECT w.* FROM webtoon w
            WHERE w.thumbnail_url <> ''
              AND (:q IS NULL OR REPLACE(REPLACE(w.title, ' ', ''), '　', '') LIKE CONCAT('%', REPLACE(REPLACE(:q, ' ', ''), '　', ''), '%')
                   OR REPLACE(REPLACE(IFNULL(w.product_name, ''), ' ', ''), '　', '') LIKE CONCAT('%', REPLACE(REPLACE(:q, ' ', ''), '　', ''), '%')
                   OR EXISTS (
                        SELECT 1 FROM webtoon_author wa JOIN author a ON a.author_id = wa.author_id
                        WHERE wa.webtoon_id = w.webtoon_id AND a.name LIKE CONCAT('%', :q, '%'))
                   OR EXISTS (
                        SELECT 1 FROM webtoon_tag wt JOIN tag t ON t.tag_id = wt.tag_id
                        WHERE wt.webtoon_id = w.webtoon_id AND t.name LIKE CONCAT('%', :q, '%')))
              AND (:platform IS NULL OR EXISTS (
                    SELECT 1 FROM platform p WHERE p.platform_id = w.platform_id AND p.name = :platform)
                   OR EXISTS (
                    SELECT 1 FROM webtoon_platform wp
                    JOIN platform p ON p.platform_id = wp.platform_id
                    WHERE wp.webtoon_id = w.webtoon_id AND p.name = :platform))
              AND (:genre IS NULL OR EXISTS (
                    SELECT 1 FROM webtoon_genre wg JOIN genre g ON g.genre_id = wg.genre_id
                    WHERE wg.webtoon_id = w.webtoon_id AND g.name = :genre))
              AND (:author IS NULL OR EXISTS (
                    SELECT 1 FROM webtoon_author wa JOIN author a ON a.author_id = wa.author_id
                    WHERE wa.webtoon_id = w.webtoon_id AND a.name = :author))
              AND (:tag IS NULL OR EXISTS (
                    SELECT 1 FROM webtoon_tag wt JOIN tag t ON t.tag_id = wt.tag_id
                    WHERE wt.webtoon_id = w.webtoon_id AND t.name = :tag))
            ORDER BY
              CASE
                WHEN :q IS NULL THEN 3
                WHEN REPLACE(REPLACE(w.title, ' ', ''), '　', '')
                     = REPLACE(REPLACE(:q, ' ', ''), '　', '') THEN 0
                WHEN REPLACE(REPLACE(w.title, ' ', ''), '　', '')
                     LIKE CONCAT('%', REPLACE(REPLACE(:q, ' ', ''), '　', ''), '%') THEN 1
                WHEN REPLACE(REPLACE(IFNULL(w.product_name, ''), ' ', ''), '　', '')
                     LIKE CONCAT('%', REPLACE(REPLACE(:q, ' ', ''), '　', ''), '%') THEN 2
                ELSE 3
              END,
              CASE WHEN :sort = 'views' THEN w.view_count END DESC,
              CASE WHEN :sort = 'bookmark' THEN w.bookmark_count END DESC,
              CASE WHEN :sort = 'rating' THEN w.rating_count END DESC,
              CASE WHEN :sort = 'rating' THEN w.rating_avg END DESC,
              w.released_at DESC,
              w.webtoon_id DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM webtoon w
            WHERE w.thumbnail_url <> ''
              AND (:q IS NULL OR REPLACE(REPLACE(w.title, ' ', ''), '　', '') LIKE CONCAT('%', REPLACE(REPLACE(:q, ' ', ''), '　', ''), '%')
                   OR REPLACE(REPLACE(IFNULL(w.product_name, ''), ' ', ''), '　', '') LIKE CONCAT('%', REPLACE(REPLACE(:q, ' ', ''), '　', ''), '%')
                   OR EXISTS (
                        SELECT 1 FROM webtoon_author wa JOIN author a ON a.author_id = wa.author_id
                        WHERE wa.webtoon_id = w.webtoon_id AND a.name LIKE CONCAT('%', :q, '%'))
                   OR EXISTS (
                        SELECT 1 FROM webtoon_tag wt JOIN tag t ON t.tag_id = wt.tag_id
                        WHERE wt.webtoon_id = w.webtoon_id AND t.name LIKE CONCAT('%', :q, '%')))
              AND (:platform IS NULL OR EXISTS (
                    SELECT 1 FROM platform p WHERE p.platform_id = w.platform_id AND p.name = :platform)
                   OR EXISTS (
                    SELECT 1 FROM webtoon_platform wp
                    JOIN platform p ON p.platform_id = wp.platform_id
                    WHERE wp.webtoon_id = w.webtoon_id AND p.name = :platform))
              AND (:genre IS NULL OR EXISTS (
                    SELECT 1 FROM webtoon_genre wg JOIN genre g ON g.genre_id = wg.genre_id
                    WHERE wg.webtoon_id = w.webtoon_id AND g.name = :genre))
              AND (:author IS NULL OR EXISTS (
                    SELECT 1 FROM webtoon_author wa JOIN author a ON a.author_id = wa.author_id
                    WHERE wa.webtoon_id = w.webtoon_id AND a.name = :author))
              AND (:tag IS NULL OR EXISTS (
                    SELECT 1 FROM webtoon_tag wt JOIN tag t ON t.tag_id = wt.tag_id
                    WHERE wt.webtoon_id = w.webtoon_id AND t.name = :tag))
            """,
            nativeQuery = true)
    Page<Webtoon> search(@Param("q") String q,
                         @Param("platform") String platform,
                         @Param("genre") String genre,
                         @Param("author") String author,
                         @Param("tag") String tag,
                         @Param("sort") String sort,
                         Pageable pageable);

    // 목록 배지용: [webtoon_id, platform_name, logo_url]
    @Query(value = """
            SELECT wp.webtoon_id, p.name, p.logo_url
            FROM webtoon_platform wp
            JOIN platform p ON p.platform_id = wp.platform_id
            WHERE wp.webtoon_id IN (:ids)
            """, nativeQuery = true)
    List<Object[]> findPlatformNamesForWebtoons(@Param("ids") List<Long> ids);

    // 플랫폼 이름 → 로고
    @Query(value = """
            SELECT p.name, p.logo_url FROM platform p WHERE p.name IN (:names)
            """, nativeQuery = true)
    List<Object[]> findPlatformLogosByNames(@Param("names") List<String> names);

    // 작가: [name, role]
    @Query(value = """
            SELECT DISTINCT a.name, wa.role FROM webtoon_author wa
            JOIN author a ON a.author_id = wa.author_id
            WHERE wa.webtoon_id = :id ORDER BY wa.role
            """, nativeQuery = true)
    List<Object[]> findAuthors(@Param("id") Long id);

    @Query(value = """
            SELECT g.name FROM webtoon_genre wg
            JOIN genre g ON g.genre_id = wg.genre_id
            WHERE wg.webtoon_id = :id ORDER BY g.name
            """, nativeQuery = true)
    List<String> findGenreNames(@Param("id") Long id);

    @Query(value = """
            SELECT t.name FROM webtoon_tag wt
            JOIN tag t ON t.tag_id = wt.tag_id
            WHERE wt.webtoon_id = :id ORDER BY t.usage_count DESC LIMIT 15
            """, nativeQuery = true)
    List<String> findTagNames(@Param("id") Long id);

    // 필터 옵션: 실제 (썸네일 있는) 웹툰이 쓰는 장르만, 사용 빈도순
    @Query(value = """
            SELECT g.name FROM webtoon_genre wg
            JOIN genre g ON g.genre_id = wg.genre_id
            JOIN webtoon w ON w.webtoon_id = wg.webtoon_id AND w.thumbnail_url <> ''
            GROUP BY g.name ORDER BY COUNT(*) DESC
            """, nativeQuery = true)
    List<String> findAllGenreNames();

    @Query(value = """
            SELECT p.name FROM webtoon w
            JOIN platform p ON p.platform_id = w.platform_id
            WHERE w.thumbnail_url <> ''
            GROUP BY p.name ORDER BY COUNT(*) DESC
            """, nativeQuery = true)
    List<String> findAllPlatformNames();

    // 인기 태그: 썸네일 있는 작품에 달린 태그를 사용 빈도순
    @Query(value = """
            SELECT t.name FROM webtoon_tag wt
            JOIN tag t ON t.tag_id = wt.tag_id
            JOIN webtoon w ON w.webtoon_id = wt.webtoon_id AND w.thumbnail_url <> ''
            GROUP BY t.name
            ORDER BY COUNT(*) DESC, COALESCE(MAX(t.usage_count), 0) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<String> findPopularTagNames(@Param("limit") int limit);

    // 상세: 구글 검색만 제외 (플랫폼 자체 검색 URL은 딥링크 폴백으로 허용)
    @Query(value = """
            SELECT p.name, wp.watch_url, p.logo_url, wp.is_primary
            FROM webtoon_platform wp
            JOIN platform p ON p.platform_id = wp.platform_id
            WHERE wp.webtoon_id = :id
              AND wp.watch_url IS NOT NULL AND wp.watch_url <> ''
              AND LOWER(wp.watch_url) NOT LIKE '%google.%'
            ORDER BY wp.is_primary DESC, p.name
            """, nativeQuery = true)
    List<Object[]> findPlatformLinks(@Param("id") Long id);

    // 미디어믹스: [id, media_type, media_title, season, year, platform, status, namu_wiki_url, watch_url]
    @Query(value = """
            SELECT m.id, m.media_type, m.media_title, m.season, m.year,
                   m.platform, m.status, m.namu_wiki_url, m.watch_url
            FROM media_mix m
            WHERE m.webtoon_id = :id
            ORDER BY FIELD(m.media_type, 'movie', 'tv_drama', 'web_drama', 'animation'),
                     m.year IS NULL, m.year, m.id
            """, nativeQuery = true)
    List<Object[]> findMediaMix(@Param("id") Long id);

    // 미디어믹스 시청 링크: [media_mix_id, url, label]
    @Query(value = """
            SELECT l.media_mix_id, l.url, l.label
            FROM media_mix_link l
            JOIN media_mix m ON m.id = l.media_mix_id
            WHERE m.webtoon_id = :id
            ORDER BY l.media_mix_id, l.sort_order, l.id
            """, nativeQuery = true)
    List<Object[]> findMediaMixLinks(@Param("id") Long id);

    // 홈 TOP N: 리뷰 수 → 조회수 → 최근 리뷰 시각
    @Query(value = """
            SELECT w.* FROM webtoon w
            WHERE w.thumbnail_url <> ''
            ORDER BY w.rating_count DESC,
                     w.view_count DESC,
                     (SELECT MAX(r.created_at) FROM review r
                       WHERE r.webtoon_id = w.webtoon_id AND r.is_deleted = 0) DESC,
                     w.webtoon_id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Webtoon> findRanking(@Param("limit") int limit);

    // 기동 시 1회: review 테이블 → webtoon.rating_count / rating_avg 동기화
    @Modifying
    @Query(value = """
            UPDATE webtoon w
            LEFT JOIN (
                SELECT webtoon_id,
                       COUNT(*) AS cnt,
                       ROUND(AVG(rating), 2) AS avg_rating
                FROM review
                WHERE is_deleted = 0
                GROUP BY webtoon_id
            ) s ON s.webtoon_id = w.webtoon_id
            SET w.rating_count = COALESCE(s.cnt, 0),
                w.rating_avg = COALESCE(s.avg_rating, 0)
            """, nativeQuery = true)
    int backfillRatingStatsFromReviews();
}
