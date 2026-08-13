package com.quokkatoon.board.dto;

// 게시글 추천/비추천 후 갱신된 카운트 + 내 현재 반응 상태
public record PostReactionResponse(
        int likes,
        int dislikes,
        String myReaction   // "LIKE" | "DISLIKE" | null
) {}
