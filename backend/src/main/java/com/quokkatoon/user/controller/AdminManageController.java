package com.quokkatoon.user.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.user.dto.AdminUserItem;
import com.quokkatoon.user.service.AdminRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 관리자용 — 현재 관리자 목록/해제 (/api/admin/** 은 ROLE_ADMIN 필요)
@RestController
@RequestMapping("/api/admin/admins")
@RequiredArgsConstructor
public class AdminManageController {

    private final AdminRequestService adminRequestService;

    // 현재 관리자 목록
    @GetMapping
    public ApiResponse<List<AdminUserItem>> list() {
        return ApiResponse.ok(adminRequestService.getAdmins());
    }

    // 관리자 해제(강등)
    @PostMapping("/{userId}/revoke")
    public ApiResponse<Void> revoke(@PathVariable Long userId,
                                    @AuthenticationPrincipal Long currentAdminId) {
        adminRequestService.revokeAdmin(userId, currentAdminId);
        return ApiResponse.ok(null);
    }
}
