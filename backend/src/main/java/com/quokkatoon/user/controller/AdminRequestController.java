package com.quokkatoon.user.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.user.dto.AdminRequestResponse;
import com.quokkatoon.user.service.AdminRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// 일반 유저용 — 관리자 승격 요청 (로그인 필요)
@RestController
@RequestMapping("/api/admin-requests")
@RequiredArgsConstructor
public class AdminRequestController {

    private final AdminRequestService adminRequestService;

    // 승격 요청
    @PostMapping
    public ApiResponse<Void> request(@AuthenticationPrincipal Long userId) {
        adminRequestService.request(userId);
        return ApiResponse.ok(null);
    }

    // 내 요청 상태 (없으면 data=null)
    @GetMapping("/mine")
    public ApiResponse<AdminRequestResponse> mine(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(adminRequestService.getMine(userId));
    }
}
