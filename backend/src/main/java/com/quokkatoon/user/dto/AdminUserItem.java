package com.quokkatoon.user.dto;

import com.quokkatoon.user.entity.User;

import java.time.LocalDateTime;

// 현재 관리자 목록 한 줄
public record AdminUserItem(
        Long userId,
        String nickname,
        String email,
        int level,
        LocalDateTime createdAt
) {
    public static AdminUserItem from(User u) {
        return new AdminUserItem(u.getId(), u.getNickname(), u.getEmail(), u.getLevel(), u.getCreatedAt());
    }
}
