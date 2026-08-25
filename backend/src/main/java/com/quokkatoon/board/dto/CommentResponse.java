package com.quokkatoon.board.dto;

import com.quokkatoon.board.entity.Comment;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        String author,
        Long authorId,
        int authorLevel,
        boolean mine,
        String text,
        int likes,
        boolean liked,
        Long parentId,
        LocalDateTime createdAt
) {
    public static CommentResponse of(Comment c, Long currentUserId, boolean liked) {
        return new CommentResponse(
                c.getId(),
                c.getUser().getNickname(),
                c.getUser().getId(),
                c.getUser().getLevel(),
                c.isAuthor(currentUserId),
                c.getContent(),
                c.getLikeCount(),
                liked,
                c.getParentId(),
                c.getCreatedAt()
        );
    }
}
