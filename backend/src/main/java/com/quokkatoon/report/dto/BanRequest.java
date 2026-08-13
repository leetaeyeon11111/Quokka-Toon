package com.quokkatoon.report.dto;

public record BanRequest(
        String duration,       // "3일" | "7일" | "30일" | "영구" (감사 로그용, 만료 자동해제는 미구현)
        String reason,
        boolean deletePost     // 신고 대상 게시글도 함께 삭제할지
) {}
