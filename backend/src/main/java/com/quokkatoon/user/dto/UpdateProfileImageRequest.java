package com.quokkatoon.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// 마이페이지 프로필 이미지(아이콘) 변경 요청
public record UpdateProfileImageRequest(
        @NotBlank @Size(max = 500) String profileImageUrl
) {}
