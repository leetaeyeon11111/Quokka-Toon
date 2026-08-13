package com.quokkatoon.user.dto;

import com.quokkatoon.user.entity.Gender;
import com.quokkatoon.user.entity.User;

import java.time.LocalDate;

// 현재 로그인한 회원의 정보 (GET /api/auth/me)
public record UserResponse(
        Long userId,
        String email,
        String nickname,
        String profileImageUrl,
        Gender gender,
        LocalDate birthDate,
        int level,
        int exp,
        int warningCount,
        String role
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getProfileImageUrl(),
                user.getGender(),
                user.getBirthDate(),
                user.getLevel(),
                user.getExp(),
                user.getWarningCount(),
                user.getRole().name()
        );
    }
}
