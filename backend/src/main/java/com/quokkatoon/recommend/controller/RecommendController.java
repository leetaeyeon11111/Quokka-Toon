package com.quokkatoon.recommend.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.recommend.dto.RecommendRequest;
import com.quokkatoon.recommend.dto.RecommendResponse;
import com.quokkatoon.recommend.service.RecommendService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommend")
@RequiredArgsConstructor
public class RecommendController {

    private final RecommendService recommendService;

    // 자연어 추천: React → Spring → (내부) FastAPI
    @PostMapping
    public ApiResponse<RecommendResponse> recommend(@Valid @RequestBody RecommendRequest body) {
        // 로그인 상태면 JWT 필터가 넣어둔 userId 를 꺼내 취향 기반 점수에 활용
        Long userId = currentUserIdOrNull();
        RecommendRequest req = new RecommendRequest(body.query(), userId);
        return ApiResponse.ok(recommendService.recommend(req));
    }

    private Long currentUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long uid) {
            return uid;
        }
        return null;
    }
}
