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
@Table(name = "report")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long id;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, columnDefinition = "ENUM('POST','COMMENT','REVIEW')")
    private ReportTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;   // 피신고자

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false,
            columnDefinition = "ENUM('SPAM','ABUSE','OBSCENE','FLOOD','COPYRIGHT')")
    private ReportType reportType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('PENDING','RESOLVED','REJECTED')")
    private ReportStatus status = ReportStatus.PENDING;

    @Column(name = "handled_by")
    private Long handledBy;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    @Builder
    private Report(Long reporterId, ReportTargetType targetType, Long targetId,
                   Long targetUserId, ReportType reportType) {
        this.reporterId = reporterId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.targetUserId = targetUserId;
        this.reportType = reportType;
        this.status = ReportStatus.PENDING;
    }

    public void handle(ReportStatus status, Long adminId) {
        this.status = status;
        this.handledBy = adminId;
        this.handledAt = LocalDateTime.now();
    }
}
