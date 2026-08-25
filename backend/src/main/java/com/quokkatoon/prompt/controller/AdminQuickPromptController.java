package com.quokkatoon.prompt.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.prompt.dto.QuickPromptRequest;
import com.quokkatoon.prompt.dto.QuickPromptResponse;
import com.quokkatoon.prompt.service.QuickPromptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 관리자 전용 (/api/admin/** 은 SecurityConfig 에서 ROLE_ADMIN 필요)
@RestController
@RequestMapping("/api/admin/quick-prompts")
@RequiredArgsConstructor
public class AdminQuickPromptController {

    private final QuickPromptService quickPromptService;

    @GetMapping
    public ApiResponse<List<QuickPromptResponse>> list() {
        return ApiResponse.ok(quickPromptService.list());
    }

    @PostMapping
    public ApiResponse<QuickPromptResponse> create(@Valid @RequestBody QuickPromptRequest req) {
        return ApiResponse.ok(quickPromptService.create(req));
    }

    @PutMapping("/{id}")
    public ApiResponse<QuickPromptResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody QuickPromptRequest req) {
        return ApiResponse.ok(quickPromptService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        quickPromptService.delete(id);
        return ApiResponse.ok(null);
    }
}
