package com.quokkatoon.inquiry.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import com.quokkatoon.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "inquiry")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inquiry extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inquiry_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('PAYMENT','BUG','SUGGEST','ACCOUNT','ETC')")
    private InquiryCategory category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('WAITING','DONE')")
    private InquiryStatus status = InquiryStatus.WAITING;

    @Builder
    private Inquiry(User user, InquiryCategory category, String title, String content) {
        this.user = user;
        this.category = category;
        this.title = title;
        this.content = content;
        this.status = InquiryStatus.WAITING;
    }

    // 답변 등록 완료로 상태 전환 (답변 본문은 inquiry_answer 에 별도 저장)
    public void markDone() {
        this.status = InquiryStatus.DONE;
    }

    public boolean isAuthor(Long userId) {
        return userId != null && user != null && user.getId().equals(userId);
    }
}
