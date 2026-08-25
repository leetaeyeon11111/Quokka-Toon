package com.quokkatoon.webtoon.repository;

import com.quokkatoon.webtoon.entity.Webtoon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WebtoonRepository extends JpaRepository<Webtoon, Long> {

    // 목록 검색: 제목(q)/플랫폼/장르/작가 선택 필터. 정렬은 Pageable(DB 컬럼명)로 받는다.
    @Query(value = """
            SELECT w.* FROM webtoon w
            WHERE w.thumbnail_url <> ''
              AND (:q IS NULL OR w.title LIKE CONCAT('%', :q, '%'))
              AND (:platform IS NULL OR EXISTS (
                    SELECT 1 FROM platform p WHERE p.platform_id = w.platform_id AND p.name = :platform))
              AND (:genre IS NULL OR EXISTS (
                    SELECT 1 FROM webtoon_genre wg JOIN genre g ON g.genre_id = wg.genre_id
                    WHERE wg.webtoon_id = w.webtoon_id AND g.name = :genre))
              AND (:author IS NULL OR EXISTS (
                    SELECT 1 FROM webtoon_author wa JOIN author a ON a.author_id = wa.author_id
                    WHERE wa.webtoon_id = w.webtoon_id AND a.name = :author))
            """,
            countQuery = """
            SELECT COUNT(*) FROM webtoon w
            WHERE w.thumbnail_url <> ''
              AND (:q IS NULL OR w.title LIKE CONCAT('%', :q, '%'))
              AND (:platform IS NULL OR EXISTS (
                    SELECT 1 FROM platform p WHERE p.platform_id = w.platform_id AND p.name = :platform))
              AND (:genre IS NULL OR EXISTS (
                    SELECT 1 FROM webtoon_genre wg JOIN genre g ON g.genre_id = wg.genre_id
                    WHERE wg.webtoon_id = w.webtoon_id AND g.name = :genre))
              AND (:author IS NULL OR EXISTS (
                    SELECT 1 FROM webtoon_author wa JOIN author a ON a.author_id = wa.author_id
                    WHERE wa.webtoon_id = w.webtoon_id AND a.name = :author))
            """,
            nativeQuery = true)
    Page<Webtoon> search(@Param("q") String q,
                         @Param("platform") String platform,
                         @Param("genre") String genre,
                         @Param("author") String author,
                         Pageable pageable);

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
}
