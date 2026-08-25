package com.quokkatoon.report.dto;

import com.quokkatoon.report.entity.Report;

import java.time.LocalDateTime;

// 관리자 신고함 한 줄. title/board/author 는 서비스가 대상 글/댓글에서 조회해 채운다.
public record ReportResponse(
        Long id,
        String type,
        String targetType,
        Long targetId,
        Long reportedUserId,
        String author,      // 신고 대상 작성자 닉네임
        String title,       // 대상 글 제목 or 댓글 내용 일부
        String board,       // '자유게시판' | '웹툰게시판' | '댓글'
        String status,
        LocalDateTime createdAt,
        LocalDateTime handledAt
) {
    public static ReportResponse of(Report r, String author, String title, String board) {
        return new ReportResponse(
                r.getId(),
                r.getReportType().name(),
                r.getTargetType().name(),
                r.getTargetId(),
                r.getTargetUserId(),
                author,
                title,
                board,
                r.getStatus().name(),
                r.getCreatedAt(),
                r.getHandledAt()
        );
    }
}
