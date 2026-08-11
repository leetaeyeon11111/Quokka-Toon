package com.quokkatoon.recommend.dto;

import jakarta.validation.constraints.NotBlank;

// 프론트 → Spring. userId 는 로그인 시 JWT 에서 채워 넣는다(비로그인은 null).
public record RecommendRequest(
        @NotBlank String query,
        Long userId
) {}
