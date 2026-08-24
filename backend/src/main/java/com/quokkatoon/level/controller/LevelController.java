package com.quokkatoon.level.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.level.dto.ExperienceLogResponse;
import com.quokkatoon.level.service.ExperienceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/level")
@RequiredArgsConstructor
public class LevelController {

    private final ExperienceService experienceService;

    @GetMapping("/logs")
    public ApiResponse<List<ExperienceLogResponse>> recentLogs(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(experienceService.getRecentEarnings(userId, limit));
    }
}
