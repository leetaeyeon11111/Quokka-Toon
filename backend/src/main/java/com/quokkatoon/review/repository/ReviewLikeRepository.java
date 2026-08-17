package com.quokkatoon.review.repository;

import com.quokkatoon.review.entity.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {
    Optional<ReviewLike> findByReviewIdAndUserId(Long reviewId, Long userId);
    void deleteAllByReviewId(Long reviewId);
}
