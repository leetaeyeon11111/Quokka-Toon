package com.quokkatoon.user.dto;

public record TokenResponse(
        String accessToken,
        Long userId,
        String nickname,
        int level
) {}
