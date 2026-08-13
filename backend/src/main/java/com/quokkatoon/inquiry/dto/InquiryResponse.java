package com.quokkatoon.inquiry.dto;

import com.quokkatoon.inquiry.entity.Inquiry;

import java.time.LocalDateTime;

public record InquiryResponse(
        Long id,
        String category,
        String title,
        String content,
        String author,
        Long authorId,
        boolean mine,
        String status,
        String answer,        // inquiry_answer 에서 조회 (없으면 null)
        LocalDateTime createdAt
) {
    public static InquiryResponse of(Inquiry inq, String answer, Long currentUserId) {
        return new InquiryResponse(
                inq.getId(),
                inq.getCategory().name(),
                inq.getTitle(),
                inq.getContent(),
                inq.getUser().getNickname(),
                inq.getUser().getId(),
                inq.isAuthor(currentUserId),
                inq.getStatus().name(),
                answer,
                inq.getCreatedAt()
        );
    }
}
