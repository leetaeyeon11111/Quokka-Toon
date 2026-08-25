package com.quokkatoon.inquiry.dto;

import com.quokkatoon.inquiry.entity.Inquiry;
import com.quokkatoon.inquiry.entity.InquiryAnswer;

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
        String answer,           // inquiry_answer 에서 조회 (없으면 null)
        String answeredByName,   // 답변한 관리자 닉네임 (없으면 null)
        LocalDateTime answeredAt,
        LocalDateTime createdAt
) {
    public static InquiryResponse of(Inquiry inq, InquiryAnswer answer,
                                     String answeredByName, Long currentUserId) {
        return new InquiryResponse(
                inq.getId(),
                inq.getCategory().name(),
                inq.getTitle(),
                inq.getContent(),
                inq.getUser().getNickname(),
                inq.getUser().getId(),
                inq.isAuthor(currentUserId),
                inq.getStatus().name(),
                answer == null ? null : answer.getContent(),
                answeredByName,
                answer == null ? null : answer.getAnsweredAt(),
                inq.getCreatedAt()
        );
    }
}
