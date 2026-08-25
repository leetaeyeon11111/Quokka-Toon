package com.quokkatoon.user.dto;

import com.quokkatoon.report.entity.BanDuration;
import com.quokkatoon.report.entity.UserBan;

import java.time.LocalDateTime;

/** 정지 계정 안내용 — GET /api/auth/ban-status 및 403 응답 data. */
public record BanStatusResponse(
        boolean banned,
        String reason,
        String durationLabel,
        LocalDateTime expiresAt
) {
    public static BanStatusResponse active(UserBan ban) {
        String reason = ban.getMemo();
        if (reason == null || reason.isBlank()) {
            reason = "운영 정책 위반";
        }
        return new BanStatusResponse(
                true,
                reason.trim(),
                durationLabel(ban.getDurationType()),
                ban.getExpiresAt());
    }

    public static BanStatusResponse notBanned() {
        return new BanStatusResponse(false, null, null, null);
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
