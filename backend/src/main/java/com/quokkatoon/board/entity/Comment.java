package com.quokkatoon.board.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import com.quokkatoon.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "comment")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 대댓글이면 상위 댓글 id, 최상위면 null
    @Column(name = "parent_id")
    private Long parentId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "like_count", nullable = false)
    private int likeCount = 0;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    @Builder
    private Comment(Post post, User user, Long parentId, String content) {
        this.post = post;
        this.user = user;
        this.parentId = parentId;
        this.content = content;
    }

    public void softDelete() { this.deleted = true; }

    public void changeLikeCount(int delta) { this.likeCount = Math.max(0, this.likeCount + delta); }

    public boolean isAuthor(Long userId) {
        return userId != null && user != null && user.getId().equals(userId);
    }
}
