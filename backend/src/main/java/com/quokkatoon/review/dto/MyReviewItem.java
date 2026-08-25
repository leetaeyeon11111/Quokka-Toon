package com.quokkatoon.review.dto;

import com.quokkatoon.review.entity.Review;

import java.time.LocalDateTime;

// 마이페이지 "내가 쓴 리뷰" 한 줄 (리뷰 + 어느 웹툰인지)
public record MyReviewItem(
        Long reviewId,
        Long webtoonId,
        String webtoonTitle,
        String thumbnailUrl,
        int rating,
        String text,
        int likes,
        LocalDateTime createdAt
) {
    public static MyReviewItem of(Review r) {
        return new MyReviewItem(
                r.getId(),
                r.getWebtoon().getId(),
                r.getWebtoon().getTitle(),
                r.getWebtoon().getThumbnailUrl(),
                r.getRating(),
                r.getContent(),
                r.getLikeCount(),
                r.getCreatedAt()
        );
    }
}
