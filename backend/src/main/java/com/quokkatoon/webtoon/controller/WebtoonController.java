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
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/webtoons")
@RequiredArgsConstructor
public class WebtoonController {

    private final WebtoonService webtoonService;
    private final WebtoonLinkService webtoonLinkService;

    // 목록: GET /api/webtoons?page=0&size=24&sort=latest&q=&platform=&genre=&author=
    @GetMapping
    public ApiResponse<Page<WebtoonListItem>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String author) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 60), sortOf(sort));
        return ApiResponse.ok(webtoonService.search(q, platform, genre, author, pageable));
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

    // 상세: GET /api/webtoons/{id}
    @GetMapping("/{id}")
    public ApiResponse<WebtoonDetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(webtoonService.detail(id));
    }

    // 바로 보기 링크: GET /api/webtoons/{id}/view-link
    // 클라우드 메타 API(korea-webtoon-api)에서 플랫폼별 열람 링크를 실시간 조회한다.
    @GetMapping("/{id}/view-link")
    public ApiResponse<ViewLinkResponse> viewLink(@PathVariable Long id) {
        return ApiResponse.ok(webtoonLinkService.viewLink(id));
    }

    // 정렬 키 → DB 컬럼 (조회수/평점은 현재 0이라 latest 가 기본)
    private Sort sortOf(String sort) {
        return switch (sort) {
            case "views" -> Sort.by(Sort.Direction.DESC, "view_count");
            case "rating" -> Sort.by(Sort.Direction.DESC, "rating_avg");
            case "bookmark" -> Sort.by(Sort.Direction.DESC, "bookmark_count");
            default -> Sort.by(Sort.Direction.DESC, "webtoon_id");
        };
    }
}
