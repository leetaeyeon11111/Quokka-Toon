package com.quokkatoon.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentCreateRequest(
        @NotBlank(message = "댓글을 입력해주세요.") @Size(max = 1000) String text,
        Long parentId       // 대댓글이면 상위 댓글 id, 아니면 null
) {}
