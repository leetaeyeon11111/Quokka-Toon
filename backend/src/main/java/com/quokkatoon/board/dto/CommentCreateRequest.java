package com.quokkatoon.board.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentCreateRequest(
        @NotBlank(message = "댓글을 입력해주세요.") String text,
        Long parentId       // 대댓글이면 상위 댓글 id, 아니면 null
) {}
