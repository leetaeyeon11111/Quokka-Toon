package com.quokkatoon.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @Min(1) @Max(5) int rating,
        @NotBlank(message = "리뷰를 입력해주세요.") @Size(max = 2000) String content
) {}
