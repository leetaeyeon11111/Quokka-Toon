package com.quokkatoon.webtoon.dto;

import com.quokkatoon.webtoon.entity.Webtoon;

import java.math.BigDecimal;

// 상세페이지(1e) 기본정보 히어로 영역. 태그/작가/추천은 별도 조회로 확장.
public record WebtoonDetailResponse(
        Long id,
        String title,
        String illustrationUrl,
        String platformName,
        String externalUrl,
        String mainGenre,
        String ageRating,
        String publishDay,
        String serialStatus,
        long viewCount,
        BigDecimal ratingAvg,
        int ratingCount,
        String summary,
        String aiSummary
) {
    public static WebtoonDetailResponse from(Webtoon w) {
        return new WebtoonDetailResponse(
                w.getId(), w.getTitle(), w.getIllustrationUrl(),
                w.getPlatform() != null ? w.getPlatform().getName() : null,
                w.getExternalUrl(),
                w.getMainGenre() != null ? w.getMainGenre().getName() : null,
                w.getAgeRating(),
                w.getPublishDay() != null ? w.getPublishDay().name() : null,
                w.getSerialStatus().name(),
                w.getViewCount(), w.getRatingAvg(), w.getRatingCount(),
                w.getSummary(), w.getAiSummary()
        );
    }
}
