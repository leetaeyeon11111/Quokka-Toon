package com.quokkatoon.report.entity;

import java.time.LocalDateTime;

// user_ban.duration_type. 프론트 '3일/7일/30일/영구' 라벨과 매핑.
public enum BanDuration {
    D3(3), D7(7), D30(30), PERMANENT(null);

    private final Integer days;

    BanDuration(Integer days) {
        this.days = days;
    }

    public static BanDuration fromLabel(String label) {
        if (label == null) return D7;
        return switch (label.trim()) {
            case "3일" -> D3;
            case "30일" -> D30;
            case "영구" -> PERMANENT;
            default -> D7;
        };
    }

    // 만료 시각. 영구면 null.
    public LocalDateTime expiresAt(LocalDateTime from) {
        return days == null ? null : from.plusDays(days);
    }
}
