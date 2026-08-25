package com.quokkatoon.user.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.user.dto.BannedUserItem;
import com.quokkatoon.user.service.BanService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 관리자 벤 관리 (/api/admin/** 은 ROLE_ADMIN). */
@RestController
@RequestMapping("/api/admin/bans")
@RequiredArgsConstructor
public class AdminBanController {

    private final BanService banService;

    @GetMapping
    public ApiResponse<List<BannedUserItem>> list() {
        return ApiResponse.ok(banService.listBannedUsers());
    }

    @PostMapping("/{userId}/unban")
    public ApiResponse<Void> unban(@PathVariable Long userId) {
        banService.unban(userId);
        return ApiResponse.ok(null);
    }
}
