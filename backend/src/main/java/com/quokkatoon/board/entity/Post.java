package com.quokkatoon.board.entity;

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
@Table(name = "post")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private BoardCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 웹툰게시판 전용 대상 작품. 자유게시판이면 null
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "webtoon_id")
    private Webtoon webtoon;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TINYINT")
    private Integer rating;

    @Column(name = "view_count", nullable = false)
    private int viewCount = 0;

    @Column(name = "like_count", nullable = false)
    private int likeCount = 0;

    @Column(name = "dislike_count", nullable = false)
    private int dislikeCount = 0;

    @Column(name = "comment_count", nullable = false)
    private int commentCount = 0;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    @Builder
    private Post(BoardCategory category, User user, Webtoon webtoon,
                String title, String content, Integer rating) {
        this.category = category;
        this.user = user;
        this.webtoon = webtoon;
        this.title = title;
        this.content = content;
        this.rating = rating;
    }

    public void softDelete() { this.deleted = true; }

    public void increaseView() { this.viewCount++; }

    public void increaseComment() { this.commentCount++; }
    public void decreaseComment() { if (this.commentCount > 0) this.commentCount--; }

    public void changeLikeCount(int delta) { this.likeCount = Math.max(0, this.likeCount + delta); }
    public void changeDislikeCount(int delta) { this.dislikeCount = Math.max(0, this.dislikeCount + delta); }

    public boolean isAuthor(Long userId) {
        return userId != null && user != null && user.getId().equals(userId);
    }
}
