package com.quokkatoon.webtoon.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.webtoon.dto.WebtoonDetailResponse;
import com.quokkatoon.webtoon.dto.WebtoonListItem;
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
        // 검색어가 있으면 제목 일치가 태그 일치보다 앞에 오도록
        // native 쿼리 ORDER BY(관련도)를 쓰고, Pageable Sort 는 붙이지 않는다.
        boolean hasQuery = q != null && !q.isBlank();
        Pageable pageable = hasQuery
                ? PageRequest.of(page, safeSize)
                : PageRequest.of(page, safeSize, sortOf(sort));
        return ApiResponse.ok(webtoonService.search(q, platform, genre, author, tag, pageable));
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

    // 홈 TOP N: 리뷰 수 → 조회수 → 최근 리뷰
    @GetMapping("/ranking")
    public ApiResponse<List<WebtoonListItem>> ranking(
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(webtoonService.ranking(size));
    }

    // 상세: GET /api/webtoons/{id}
    @GetMapping("/{id}")
    public ApiResponse<WebtoonDetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(webtoonService.detail(id));
    }

    // 정렬 키 → native search 쿼리용 DB 컬럼명
    // latest = 연재 시작일(released_at). MySQL DESC 에서 NULL 은 뒤로 밀림.
    // rating = 리뷰 건수 우선, 동률이면 평점 평균
    private Sort sortOf(String sort) {
        return switch (sort) {
            case "views" -> Sort.by(Sort.Direction.DESC, "view_count");
            case "rating" -> Sort.by(
                    Sort.Order.desc("rating_count"),
                    Sort.Order.desc("rating_avg"));
            case "bookmark" -> Sort.by(Sort.Direction.DESC, "bookmark_count");
            default -> Sort.by(
                    Sort.Order.desc("released_at"),
                    Sort.Order.desc("webtoon_id"));
        };
    }
}
