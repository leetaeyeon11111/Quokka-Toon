package com.quokkatoon.board.dto;

import com.quokkatoon.board.entity.Comment;

import java.time.LocalDateTime;

// 마이페이지 "내가 쓴 댓글" 한 줄 (댓글 + 어느 게시글인지)
public record MyCommentItem(
        Long commentId,
        Long postId,
        String board,
        String postTitle,
        String text,
        int likes,
        LocalDateTime createdAt
) {
    public static MyCommentItem of(Comment c) {
        return new MyCommentItem(
                c.getId(),
                c.getPost().getId(),
                c.getPost().getCategory().codeLower(),
                c.getPost().getTitle(),
                c.getContent(),
                c.getLikeCount(),
                c.getCreatedAt()
        );
    }
}
