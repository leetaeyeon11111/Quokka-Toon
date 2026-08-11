package com.quokkatoon.webtoon.repository;

import com.quokkatoon.webtoon.entity.Webtoon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebtoonRepository extends JpaRepository<Webtoon, Long> {

    // 플랫폼/장르 필터는 필요에 따라 확장. 우선 기본 목록 + 플랫폼 필터 예시.
    Page<Webtoon> findByPlatformId(Long platformId, Pageable pageable);
}
