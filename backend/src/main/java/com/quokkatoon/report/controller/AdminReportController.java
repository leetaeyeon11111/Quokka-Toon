package com.quokkatoon.report.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.report.dto.BanRequest;
import com.quokkatoon.report.dto.ReportResponse;
import com.quokkatoon.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 관리자 전용 (/api/admin/** 은 SecurityConfig 에서 ROLE_ADMIN 필요)
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;

    // 미처리 신고 목록
    @GetMapping
    public ApiResponse<List<ReportResponse>> list() {
        return ApiResponse.ok(reportService.getPending());
    }

    // 신고 반려
    @PostMapping("/{id}/resolve")
    public ApiResponse<Void> reject(@PathVariable Long id, @AuthenticationPrincipal Long adminId) {
        reportService.reject(id, adminId);
        return ApiResponse.ok(null);
    }

    // 작성자 벤 (+선택적 게시글 삭제)
    @PostMapping("/{id}/ban")
    public ApiResponse<Void> ban(@PathVariable Long id,
                                 @AuthenticationPrincipal Long adminId,
                                 @RequestBody BanRequest req) {
        reportService.ban(id, adminId, req);
        return ApiResponse.ok(null);
    }
}
