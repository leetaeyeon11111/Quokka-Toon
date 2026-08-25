package com.quokkatoon.webtoon.dto;

import com.quokkatoon.webtoon.entity.Webtoon;

import java.math.BigDecimal;

// 목록 카드용 요약 DTO. 19금은 프론트에서 쿼카로 가림(ageRating 참고).
public record WebtoonListItem(
        Long id,
        String title,
        String thumbnailUrl,
        String platformName,
        String mainGenre,
        String ageRating,
        long viewCount,
        BigDecimal ratingAvg
) {
    public static WebtoonListItem from(Webtoon w) {
        return new WebtoonListItem(
                w.getId(),
                w.getTitle(),
                w.getThumbnailUrl(),
                w.getPlatform() != null ? w.getPlatform().getName() : null,
                w.getMainGenre() != null ? w.getMainGenre().getName() : null,
                w.getAgeRating(),
                w.getViewCount(),
                w.getRatingAvg()
        );
    }
}
