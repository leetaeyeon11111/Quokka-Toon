package com.quokkatoon.user.dto;

import com.quokkatoon.user.entity.AdminRequest;

import java.time.LocalDateTime;

public record AdminRequestResponse(
        Long id,
        Long userId,
        String nickname,
        String email,
        int level,
        String status,
        LocalDateTime createdAt
) {
    public static AdminRequestResponse from(AdminRequest r) {
        return new AdminRequestResponse(
                r.getId(),
                r.getUser().getId(),
                r.getUser().getNickname(),
                r.getUser().getEmail(),
                r.getUser().getLevel(),
                r.getStatus().name(),
                r.getCreatedAt()
        );
    }
}
