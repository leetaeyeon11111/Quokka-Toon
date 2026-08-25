package com.quokkatoon.review.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.webtoon.entity.Webtoon;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "review", uniqueConstraints =
        @UniqueConstraint(name = "uq_review_user_webtoon", columnNames = {"user_id", "webtoon_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "webtoon_id", nullable = false)
    private Webtoon webtoon;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TINYINT")
    private int rating;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "like_count", nullable = false)
    private int likeCount;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @Builder
    private Review(Webtoon webtoon, User user, int rating, String content) {
        this.webtoon = webtoon;
        this.user = user;
        this.rating = rating;
        this.content = content;
    }

    public void update(int rating, String content) {
        this.rating = rating;
        this.content = content;
    }

    public void restore(int rating, String content) {
        update(rating, content);
        this.deleted = false;
        this.likeCount = 0;
    }

    public void softDelete() {
        this.deleted = true;
        this.likeCount = 0;
    }

    public void changeLikeCount(int delta) {
        this.likeCount = Math.max(0, this.likeCount + delta);
    }

    public boolean isAuthor(Long userId) {
        return userId != null && user.getId().equals(userId);
    }
}
