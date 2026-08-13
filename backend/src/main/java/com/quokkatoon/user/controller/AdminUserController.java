package com.quokkatoon.user.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.user.dto.AdminRequestResponse;
import com.quokkatoon.user.service.AdminRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 관리자용 — 승격 요청 관리 (/api/admin/** 은 ROLE_ADMIN 필요)
@RestController
@RequestMapping("/api/admin/admin-requests")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminRequestService adminRequestService;

    // 대기 중인 승격 요청 목록
    @GetMapping
    public ApiResponse<List<AdminRequestResponse>> list() {
        return ApiResponse.ok(adminRequestService.getPending());
    }

    // 승인 → 해당 유저 관리자 승격
    @PostMapping("/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Long id) {
        adminRequestService.approve(id);
        return ApiResponse.ok(null);
    }

    // 거절
    @PostMapping("/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Long id) {
        adminRequestService.reject(id);
        return ApiResponse.ok(null);
    }
}
