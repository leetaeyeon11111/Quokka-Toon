package com.quokkatoon.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ReviewRequest(
        @Min(1) @Max(5) int rating,
        @NotBlank(message = "리뷰를 입력해주세요.") String content
) {}
