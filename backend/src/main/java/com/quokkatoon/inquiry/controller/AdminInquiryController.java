package com.quokkatoon.inquiry.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.inquiry.dto.InquiryAnswerRequest;
import com.quokkatoon.inquiry.dto.InquiryResponse;
import com.quokkatoon.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 관리자 전용 (/api/admin/** 은 SecurityConfig 에서 ROLE_ADMIN 필요)
@RestController
@RequestMapping("/api/admin/inquiries")
@RequiredArgsConstructor
public class AdminInquiryController {

    private final InquiryService inquiryService;

    // 전체 문의 목록
    @GetMapping
    public ApiResponse<List<InquiryResponse>> list() {
        return ApiResponse.ok(inquiryService.getAll());
    }

    // 답변 등록
    @PostMapping("/{id}/answer")
    public ApiResponse<Void> answer(@PathVariable Long id,
                                    @AuthenticationPrincipal Long adminId,
                                    @Valid @RequestBody InquiryAnswerRequest req) {
        inquiryService.answer(id, adminId, req.answer());
        return ApiResponse.ok(null);
    }

    // 문의 삭제
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        inquiryService.delete(id);
        return ApiResponse.ok(null);
    }
}
