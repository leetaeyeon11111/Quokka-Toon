package com.quokkatoon.webtoon.dto;

import com.quokkatoon.webtoon.entity.Webtoon;

import java.math.BigDecimal;

// 목록 카드용 요약 DTO. 19금은 프론트에서 쿼카로 가림(ageRating 참고).
public record WebtoonListItem(
        Long id,
        String title,
        String thumbnailUrl,
        String platformName,
        String platformLogoUrl,
        String mainGenre,
        String ageRating,
        BigDecimal ratingAvg,
        long viewCount,
        int bookmarkCount,
        int ratingCount
) {
    public static WebtoonListItem from(Webtoon w) {
        return from(
                w,
                w.getPlatform() != null ? w.getPlatform().getName() : null,
                w.getPlatform() != null ? w.getPlatform().getLogoUrl() : null
        );
    }

    public static WebtoonListItem from(Webtoon w, String platformName, String platformLogoUrl) {
        return new WebtoonListItem(
                w.getId(),
                w.getTitle(),
                w.getThumbnailUrl(),
                platformName,
                platformLogoUrl,
                w.getMainGenre() != null ? w.getMainGenre().getName() : null,
                w.getAgeRating(),
                w.getRatingAvg(),
                w.getViewCount(),
                w.getBookmarkCount(),
                w.getRatingCount()
        );
    }
}
