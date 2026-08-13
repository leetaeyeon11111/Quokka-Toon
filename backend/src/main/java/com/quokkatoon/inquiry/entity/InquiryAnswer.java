package com.quokkatoon.inquiry.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 문의 1건당 답변 1건 (inquiry_id 유니크)
@Getter
@Entity
@Table(name = "inquiry_answer")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InquiryAnswer extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "answer_id")
    private Long id;

    @Column(name = "inquiry_id", nullable = false, unique = true)
    private Long inquiryId;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @Builder
    private InquiryAnswer(Long inquiryId, Long adminId, String content) {
        this.inquiryId = inquiryId;
        this.adminId = adminId;
        this.content = content;
        this.answeredAt = LocalDateTime.now();
    }

    public void update(String content, Long adminId) {
        this.content = content;
        this.adminId = adminId;
        this.answeredAt = LocalDateTime.now();
    }
}
