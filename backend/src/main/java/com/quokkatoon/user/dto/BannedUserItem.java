package com.quokkatoon.user.dto;

import com.quokkatoon.report.entity.BanDuration;
import com.quokkatoon.report.entity.UserBan;
import com.quokkatoon.user.entity.User;

import java.time.LocalDateTime;

/** 관리자 벤 관리 목록 한 줄. */
public record BannedUserItem(
        Long userId,
        String nickname,
        String email,
        String reason,
        String durationLabel,
        LocalDateTime bannedAt,
        LocalDateTime expiresAt,
        Long banId
) {
    public static BannedUserItem from(User user, UserBan ban) {
        String reason = ban != null ? ban.getMemo() : null;
        if (reason == null || reason.isBlank()) {
            reason = "운영 정책 위반";
        }
        return new BannedUserItem(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                reason.trim(),
                durationLabel(ban != null ? ban.getDurationType() : null),
                ban != null ? ban.getCreatedAt() : user.getUpdatedAt(),
                ban != null ? ban.getExpiresAt() : null,
                ban != null ? ban.getId() : null);
    }

    private static String durationLabel(BanDuration duration) {
        if (duration == null) return "7일";
        return switch (duration) {
            case D3 -> "3일";
            case D7 -> "7일";
            case D30 -> "30일";
            case PERMANENT -> "영구";
        };
    }
}
