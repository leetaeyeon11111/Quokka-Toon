package com.quokkatoon.webtoon.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.webtoon.dto.WebtoonDetailResponse;
import com.quokkatoon.webtoon.dto.WebtoonListItem;
import com.quokkatoon.webtoon.service.WebtoonService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webtoons")
@RequiredArgsConstructor
public class WebtoonController {

    private final WebtoonService webtoonService;

    // 목록: GET /api/webtoons?page=0&size=20&sort=viewCount,desc
    @GetMapping
    public ApiResponse<Page<WebtoonListItem>> list(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(webtoonService.list(pageable));
    }

    // 상세: GET /api/webtoons/{id}
    @GetMapping("/{id}")
    public ApiResponse<WebtoonDetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(webtoonService.detail(id));
    }
}
