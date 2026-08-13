package com.quokkatoon.user.dto;

import jakarta.validation.constraints.NotBlank;

// 프론트 콜백에서 받은 인가 코드를 백엔드로 전달
public record SocialLoginRequest(
        @NotBlank String code,
        String redirectUri,   // 카카오: 등록된 redirect_uri 와 정확히 일치해야 함
        String state          // 네이버: CSRF state
) {}
