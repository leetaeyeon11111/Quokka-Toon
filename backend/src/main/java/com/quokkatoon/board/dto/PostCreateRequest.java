package com.quokkatoon.board.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostCreateRequest(
        @NotBlank String board,          // "free" | "webtoon"
        Long webtoonId,                  // 웹툰게시판일 때 대상 웹툰 (선택)
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content,
        @Min(1) @Max(5) Integer rating   // 웹툰 리뷰 별점 (선택)
) {}
