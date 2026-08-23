package com.quokkatoon.board.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record PostCreateRequest(
        @NotBlank String board,          // "free" | "webtoon"
        Long webtoonId,                  // 웹툰게시판일 때 대상 웹툰 (선택)
        @NotBlank(message = "게시글 제목을 입력해주세요.") String title,
        @NotBlank(message = "게시글 본문을 입력해주세요.") String content,
        @Min(1) @Max(5) Integer rating   // 웹툰 리뷰 별점 (선택)
) {}
