package com.quokkatoon.webtoon.dto;

import com.quokkatoon.webtoon.entity.Webtoon;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// 상세페이지 기본정보 히어로 영역 + 연결 테이블(작가/장르/태그) 조인 결과.
public record WebtoonDetailResponse(
        Long id,
        String title,
        String thumbnailUrl,
        String illustrationUrl,
        String platformName,
        String platformLogoUrl,
        String externalUrl,
        String mainGenre,
        String ageRating,
        String publishDay,
        String serialStatus,
        int episodeCount,
        int bookmarkCount,
        long viewCount,
        BigDecimal ratingAvg,
        int ratingCount,
        LocalDate releasedAt,
        String summary,
        String aiSummary,
        List<AuthorItem> authors,
        List<String> genres,
        List<String> tags,
        List<PlatformLinkItem> platforms,
        List<MediaMixItem> mediaMix
) {
    public static WebtoonDetailResponse from(
            Webtoon w, List<AuthorItem> authors, List<String> genres, List<String> tags,
            List<PlatformLinkItem> platforms, List<MediaMixItem> mediaMix) {
        return new WebtoonDetailResponse(
                w.getId(), w.getTitle(), w.getThumbnailUrl(), w.getIllustrationUrl(),
                w.getPlatform() != null ? w.getPlatform().getName() : null,
                w.getPlatform() != null ? w.getPlatform().getLogoUrl() : null,
                w.getExternalUrl(),
                w.getMainGenre() != null ? w.getMainGenre().getName() : null,
                w.getAgeRating(),
                w.getPublishDay() != null ? w.getPublishDay().name() : null,
                w.getSerialStatus().name(),
                w.getEpisodeCount(), w.getBookmarkCount(),
                w.getViewCount(), w.getRatingAvg(), w.getRatingCount(),
                w.getReleasedAt(),
                w.getSummary(), w.getAiSummary(),
                authors, genres, tags, platforms, mediaMix
        );
    }
}
