package com.quokkatoon.search.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.search.dto.SearchHistoryDtos;
import com.quokkatoon.search.dto.SearchHistoryDtos.CreateRequest;
import com.quokkatoon.search.dto.SearchHistoryDtos.ItemResponse;
import com.quokkatoon.search.entity.SearchMode;
import com.quokkatoon.search.service.SearchHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search-history")
@RequiredArgsConstructor
public class SearchHistoryController {

    private final SearchHistoryService searchHistoryService;

    /** 최근 검색 (mode=NORMAL|AI). 로그인 사용자만. */
    @GetMapping
    public ApiResponse<List<ItemResponse>> recent(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "NORMAL") String mode) {
        return ApiResponse.ok(searchHistoryService.recent(userId, SearchHistoryDtos.parseMode(mode)));
    }

    /** 검색 실행 시 기록. */
    @PostMapping
    public ApiResponse<ItemResponse> record(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateRequest req) {
        return ApiResponse.ok(
                searchHistoryService.record(userId, req.keyword(), SearchHistoryDtos.parseMode(req.mode())));
    }

    /** 특정 키워드 1건 삭제 (해당 모드만). */
    @DeleteMapping
    public ApiResponse<Void> deleteOne(
            @AuthenticationPrincipal Long userId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "NORMAL") String mode) {
        searchHistoryService.deleteOne(userId, SearchHistoryDtos.parseMode(mode), keyword);
        return ApiResponse.ok(null);
    }

    /** 해당 모드 전체 삭제. */
    @DeleteMapping("/all")
    public ApiResponse<Void> clear(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "NORMAL") String mode) {
        searchHistoryService.clear(userId, SearchHistoryDtos.parseMode(mode));
        return ApiResponse.ok(null);
    }
}
