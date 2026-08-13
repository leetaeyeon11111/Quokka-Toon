package com.quokkatoon.report.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.report.dto.ReportCreateRequest;
import com.quokkatoon.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // 게시글/댓글 신고 (로그인)
    @PostMapping
    public ApiResponse<Long> create(@AuthenticationPrincipal Long userId,
                                    @Valid @RequestBody ReportCreateRequest req) {
        return ApiResponse.ok(reportService.create(userId, req));
    }
}
