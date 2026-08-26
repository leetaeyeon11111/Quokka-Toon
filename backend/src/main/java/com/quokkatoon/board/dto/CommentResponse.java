package com.quokkatoon.board.dto;

import com.quokkatoon.board.entity.Comment;
import com.quokkatoon.user.profile.ProfileImages;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        String author,
        Long authorId,
        int authorLevel,
        String authorProfileImageUrl,
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
                ProfileImages.forUser(c.getUser()),
                c.isAuthor(currentUserId),
                c.getContent(),
                c.getLikeCount(),
                liked,
                c.getParentId(),
                c.getCreatedAt()
        );
    }
}
