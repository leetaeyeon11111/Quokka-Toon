package com.quokkatoon.board.dto;

import com.quokkatoon.board.entity.Post;
import com.quokkatoon.user.profile.ProfileImages;

import java.time.LocalDateTime;
import java.util.List;

public record PostDetailResponse(
        Long id,
        String board,
        String webtoonTag,
        Long webtoonId,
        String title,
        String content,
        Integer rating,
        String author,
        Long authorId,
        int authorLevel,
        String authorProfileImageUrl,
        boolean mine,
        int likes,
        int dislikes,
        String myReaction,   // "LIKE" | "DISLIKE" | null
        LocalDateTime createdAt,
        List<CommentResponse> comments
) {
    public static PostDetailResponse of(Post post, List<CommentResponse> comments,
                                        Long currentUserId, String myReaction) {
        return new PostDetailResponse(
                post.getId(),
                post.getCategory().codeLower(),
                post.getWebtoon() != null ? post.getWebtoon().getTitle() : null,
                post.getWebtoon() != null ? post.getWebtoon().getId() : null,
                post.getTitle(),
                post.getContent(),
                post.getRating(),
                post.getUser().getNickname(),
                post.getUser().getId(),
                post.getUser().getLevel(),
                ProfileImages.forUser(post.getUser()),
                post.isAuthor(currentUserId),
                post.getLikeCount(),
                post.getDislikeCount(),
                myReaction,
                post.getCreatedAt(),
                comments
        );
    }
}
