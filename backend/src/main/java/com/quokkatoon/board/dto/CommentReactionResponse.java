package com.quokkatoon.board.dto;

// 댓글 좋아요 토글 후 갱신된 카운트 + 내 상태
public record CommentReactionResponse(
        int likes,
        boolean liked
) {}
