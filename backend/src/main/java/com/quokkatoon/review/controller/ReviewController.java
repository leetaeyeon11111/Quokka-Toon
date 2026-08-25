package com.quokkatoon.review.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.level.dto.ActionResponse;
import com.quokkatoon.review.dto.ReviewLikeResponse;
import com.quokkatoon.review.dto.ReviewRequest;
import com.quokkatoon.review.dto.ReviewResponse;
import com.quokkatoon.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @GetMapping("/webtoons/{webtoonId}/reviews")
    public ApiResponse<List<ReviewResponse>> list(@PathVariable Long webtoonId,
                                                  @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(reviewService.getReviews(webtoonId, userId));
    }

    @PostMapping("/webtoons/{webtoonId}/reviews")
    public ApiResponse<ActionResponse<ReviewResponse>> create(@PathVariable Long webtoonId,
                                                               @AuthenticationPrincipal Long userId,
                                                               @Valid @RequestBody ReviewRequest request) {
        return ApiResponse.ok(reviewService.create(webtoonId, userId, request));
    }

    @PutMapping("/reviews/{reviewId}")
    public ApiResponse<ActionResponse<ReviewResponse>> update(@PathVariable Long reviewId,
                                                               @AuthenticationPrincipal Long userId,
                                                               @Valid @RequestBody ReviewRequest request) {
        return ApiResponse.ok(reviewService.update(reviewId, userId, request));
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ApiResponse<ActionResponse<Void>> delete(@PathVariable Long reviewId,
                                                    @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(reviewService.delete(reviewId, userId));
    }

    @PostMapping("/reviews/{reviewId}/like")
    public ApiResponse<ActionResponse<ReviewLikeResponse>> like(@PathVariable Long reviewId,
                                                                 @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(reviewService.toggleLike(reviewId, userId));
    }
}
