package com.quokkatoon.webtoon.repository;

import com.quokkatoon.webtoon.entity.WebtoonViewEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface WebtoonViewEventRepository extends JpaRepository<WebtoonViewEvent, Long> {

    @Modifying
    @Query(value = """
            INSERT IGNORE INTO webtoon_view_event
              (webtoon_id, viewer_key, view_date, viewed_at)
            VALUES (:webtoonId, :viewerKey, :viewDate, :viewedAt)
            """, nativeQuery = true)
    int insertIfAbsent(@Param("webtoonId") Long webtoonId,
                       @Param("viewerKey") String viewerKey,
                       @Param("viewDate") LocalDate viewDate,
                       @Param("viewedAt") LocalDateTime viewedAt);
}
