package com.quokkatoon.review.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "review_like", uniqueConstraints =
        @UniqueConstraint(name = "uq_reviewlike", columnNames = {"review_id", "user_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReviewLike extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "like_id")
    private Long id;
    @Column(name = "review_id", nullable = false)
    private Long reviewId;
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Builder
    private ReviewLike(Long reviewId, Long userId) {
        this.reviewId = reviewId;
        this.userId = userId;
    }
}
