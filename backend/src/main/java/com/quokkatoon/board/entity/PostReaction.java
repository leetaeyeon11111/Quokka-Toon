package com.quokkatoon.board.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 게시글 추천/비추천 — (post_id, user_id) 유니크, 1인 1표(전환 가능)
@Getter
@Entity
@Table(name = "post_reaction",
        uniqueConstraints = @UniqueConstraint(name = "uq_postreaction", columnNames = {"post_id", "user_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostReaction extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reaction_id")
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('LIKE','DISLIKE')")
    private ReactionType type;

    @Builder
    private PostReaction(Long postId, Long userId, ReactionType type) {
        this.postId = postId;
        this.userId = userId;
        this.type = type;
    }

    public void changeType(ReactionType type) {
        this.type = type;
    }
}
