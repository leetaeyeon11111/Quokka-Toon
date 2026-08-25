package com.quokkatoon.board.dto;

import com.quokkatoon.board.entity.Post;

import java.time.LocalDateTime;

// 게시판 목록 한 줄
public record PostListItem(
        Long id,
        String board,
        String webtoonTag,
        String title,
        Integer rating,
        String author,
        int authorLevel,
        int likes,
        int dislikes,
        long commentCount,
        LocalDateTime createdAt
) {
    public static PostListItem of(Post post) {
        return new PostListItem(
                post.getId(),
                post.getCategory().codeLower(),
                post.getWebtoon() != null ? post.getWebtoon().getTitle() : null,
                post.getTitle(),
                post.getRating(),
                post.getUser().getNickname(),
                post.getUser().getLevel(),
                post.getLikeCount(),
                post.getDislikeCount(),
                post.getCommentCount(),
                post.getCreatedAt()
        );
    }
}
