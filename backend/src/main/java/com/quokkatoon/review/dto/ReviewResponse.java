package com.quokkatoon.review.dto;

import com.quokkatoon.review.entity.Review;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id, String user, Long authorId, int authorLevel, boolean mine,
        int rating, String text, int likes, boolean liked,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public static ReviewResponse of(Review review, Long currentUserId, boolean liked) {
        return new ReviewResponse(review.getId(), review.getUser().getNickname(), review.getUser().getId(),
                review.getUser().getLevel(), review.isAuthor(currentUserId), review.getRating(),
                review.getContent(), review.getLikeCount(), liked,
                review.getCreatedAt(), review.getUpdatedAt());
    }
}
