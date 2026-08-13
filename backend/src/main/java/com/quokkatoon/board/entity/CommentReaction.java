package com.quokkatoon.board.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 댓글 좋아요 — (comment_id, user_id) 유니크, LIKE 전용
@Getter
@Entity
@Table(name = "comment_reaction",
        uniqueConstraints = @UniqueConstraint(name = "uq_commentreaction", columnNames = {"comment_id", "user_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommentReaction extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reaction_id")
    private Long id;

    @Column(name = "comment_id", nullable = false)
    private Long commentId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('LIKE')")
    private ReactionType type = ReactionType.LIKE;

    @Builder
    private CommentReaction(Long commentId, Long userId) {
        this.commentId = commentId;
        this.userId = userId;
        this.type = ReactionType.LIKE;
    }
}
