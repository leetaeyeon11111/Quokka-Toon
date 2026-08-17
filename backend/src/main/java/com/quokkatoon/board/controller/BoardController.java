package com.quokkatoon.board.controller;

import com.quokkatoon.board.dto.*;
import com.quokkatoon.board.service.BoardService;
import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.level.dto.ActionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    // 목록 (공개). board = all | free | webtoon
    @GetMapping
    public ApiResponse<List<PostListItem>> list(@RequestParam(defaultValue = "all") String board) {
        return ApiResponse.ok(boardService.getPosts(board));
    }

    // 내가 쓴 게시글 (로그인)
    @GetMapping("/mine")
    public ApiResponse<List<PostListItem>> myPosts(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(boardService.getMyPosts(userId));
    }

    // 상세 (공개). 로그인 상태면 mine 플래그가 채워진다.
    @GetMapping("/{id}")
    public ApiResponse<PostDetailResponse> detail(@PathVariable Long id,
                                                  @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(boardService.getPost(id, userId));
    }

    // 글쓰기 (로그인)
    @PostMapping
    public ApiResponse<ActionResponse<Long>> create(@AuthenticationPrincipal Long userId,
                                    @Valid @RequestBody PostCreateRequest req) {
        return ApiResponse.ok(boardService.createPost(userId, req));
    }

    // 삭제 (작성자 본인)
    @DeleteMapping("/{id}")
    public ApiResponse<ActionResponse<Void>> delete(@PathVariable Long id,
                                    @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(boardService.deletePost(id, userId));
    }

    // 댓글/대댓글 등록 (로그인)
    @PostMapping("/{id}/comments")
    public ApiResponse<ActionResponse<CommentResponse>> addComment(@PathVariable Long id,
                                                   @AuthenticationPrincipal Long userId,
                                                   @Valid @RequestBody CommentCreateRequest req) {
        return ApiResponse.ok(boardService.addComment(id, userId, req));
    }

    // 게시글 추천/비추천 (1인 1표 토글) → 갱신된 카운트 + 내 반응
    @PostMapping("/{id}/react")
    public ApiResponse<ActionResponse<PostReactionResponse>> reactPost(@PathVariable Long id,
                                                       @AuthenticationPrincipal Long userId,
                                                       @RequestParam(defaultValue = "like") String kind) {
        return ApiResponse.ok(boardService.reactPost(id, userId, kind));
    }

    @DeleteMapping("/comments/{commentId}")
    public ApiResponse<ActionResponse<Void>> deleteComment(@PathVariable Long commentId,
                                                           @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(boardService.deleteComment(commentId, userId));
    }

    // 댓글 좋아요 토글 → 갱신된 카운트 + 내 상태
    @PostMapping("/comments/{commentId}/react")
    public ApiResponse<CommentReactionResponse> reactComment(@PathVariable Long commentId,
                                                             @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(boardService.reactComment(commentId, userId));
    }
}
