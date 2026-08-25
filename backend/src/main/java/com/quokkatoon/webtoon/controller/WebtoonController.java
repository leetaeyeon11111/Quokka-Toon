package com.quokkatoon.webtoon.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.webtoon.dto.ViewLinkResponse;
import com.quokkatoon.webtoon.dto.WebtoonDetailResponse;
import com.quokkatoon.webtoon.dto.WebtoonListItem;
import com.quokkatoon.webtoon.service.WebtoonLinkService;
import com.quokkatoon.webtoon.service.WebtoonService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/webtoons")
@RequiredArgsConstructor
public class WebtoonController {

    private final WebtoonService webtoonService;
    private final WebtoonLinkService webtoonLinkService;

    // 목록: GET /api/webtoons?page=0&size=24&sort=latest&q=&platform=&genre=&author=&tag=
    @GetMapping
    public ApiResponse<Page<WebtoonListItem>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String tag) {
        int safeSize = Math.min(size, 60);
        // native 쿼리에서 :sort 로 ORDER BY 처리. Pageable Sort 를 붙이면 ORDER BY 가 중복된다.
        Pageable pageable = PageRequest.of(page, safeSize);
        return ApiResponse.ok(webtoonService.search(q, platform, genre, author, tag, sort, pageable));
    }

    // 필터 옵션
    @GetMapping("/genres")
    public ApiResponse<List<String>> genres() {
        return ApiResponse.ok(webtoonService.genreNames());
    }

    @GetMapping("/platforms")
    public ApiResponse<List<String>> platforms() {
        return ApiResponse.ok(webtoonService.platformNames());
    }

    // 인기 태그 (검색 드롭다운용)
    @GetMapping("/tags/popular")
    public ApiResponse<List<String>> popularTags(
            @RequestParam(defaultValue = "16") int limit) {
        return ApiResponse.ok(webtoonService.popularTagNames(limit));
    }

    // 홈 TOP N: 최근 7일 조회·리뷰·리뷰 좋아요에 시간 감쇠 적용
    @GetMapping("/ranking")
    public ApiResponse<List<WebtoonListItem>> ranking(
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(webtoonService.ranking(size));
    }

    // 상세: GET /api/webtoons/{id} (조회수 미증가)
    @GetMapping("/{id}")
    public ApiResponse<WebtoonDetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(webtoonService.detail(id));
    }

    // 조회 기록: 동일 사용자·작품은 하루 1회만 반영
    @PostMapping("/{id}/view")
    public ApiResponse<Long> recordView(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @RequestHeader(value = "X-Visitor-Id", required = false) String visitorId) {
        return ApiResponse.ok(webtoonService.recordView(id, userId, visitorId));
    }
}
