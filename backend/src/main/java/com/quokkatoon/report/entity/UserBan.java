package com.quokkatoon.report.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "user_ban")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserBan extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ban_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;      // 정지 대상

    @Column(name = "admin_id", nullable = false)
    private Long adminId;     // 처리 관리자

    @Column(name = "report_id")
    private Long reportId;    // 시작 신고 (선택)

    @Enumerated(EnumType.STRING)
    @Column(name = "duration_type", nullable = false,
            columnDefinition = "ENUM('D3','D7','D30','PERMANENT')")
    private BanDuration durationType;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;   // 영구면 null

    @Column(length = 500)
    private String memo;

    @Column(name = "delete_content", nullable = false)
    private boolean deleteContent = false;

    @Builder
    private UserBan(Long userId, Long adminId, Long reportId, BanDuration durationType,
                    LocalDateTime expiresAt, String memo, boolean deleteContent) {
        this.userId = userId;
        this.adminId = adminId;
        this.reportId = reportId;
        this.durationType = durationType;
        this.expiresAt = expiresAt;
        this.memo = memo;
        this.deleteContent = deleteContent;
    }
}
