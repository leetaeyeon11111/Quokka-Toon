package com.quokkatoon.prompt.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.prompt.dto.QuickPromptResponse;
import com.quokkatoon.prompt.service.QuickPromptService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 공개: 메인페이지 추천 검색어 버튼 조회 (SecurityConfig 에서 GET permitAll)
@RestController
@RequestMapping("/api/quick-prompts")
@RequiredArgsConstructor
public class QuickPromptController {

    private final QuickPromptService quickPromptService;

    @GetMapping
    public ApiResponse<List<QuickPromptResponse>> list() {
        return ApiResponse.ok(quickPromptService.list());
    }
}
