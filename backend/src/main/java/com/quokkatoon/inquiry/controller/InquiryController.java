package com.quokkatoon.inquiry.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.inquiry.dto.InquiryCreateRequest;
import com.quokkatoon.inquiry.dto.InquiryResponse;
import com.quokkatoon.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    // 문의 등록 (로그인)
    @PostMapping
    public ApiResponse<Long> create(@AuthenticationPrincipal Long userId,
                                    @Valid @RequestBody InquiryCreateRequest req) {
        return ApiResponse.ok(inquiryService.create(userId, req));
    }

    // 내 문의 내역 (로그인)
    @GetMapping("/mine")
    public ApiResponse<List<InquiryResponse>> mine(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(inquiryService.getMine(userId));
    }
}
