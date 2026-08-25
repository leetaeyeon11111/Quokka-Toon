package com.quokkatoon.review.dto;

import java.time.LocalDateTime;

/** 마이페이지 '내가 쓴 리뷰' 목록 항목 */
public record MyReviewItem(
        Long id,
        Long webtoonId,
        String webtoonTitle,
        String thumbnailUrl,
        int rating,
        String text,
        int likes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
