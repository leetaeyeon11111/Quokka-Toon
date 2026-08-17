package com.quokkatoon.level.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import com.quokkatoon.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Entity
@Table(name = "user_level_log",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_levellog_event", columnNames = "event_key"),
                @UniqueConstraint(name = "uq_levellog_reversal", columnNames = "original_log_id")
        },
        indexes = {
                @Index(name = "idx_levellog_user_date", columnList = "user_id,activity_date"),
                @Index(name = "idx_levellog_user_action_date", columnList = "user_id,action_type,activity_date"),
                @Index(name = "idx_levellog_ref", columnList = "ref_type,ref_id")
        })
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserLevelLog extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false,
            columnDefinition = "ENUM('POST','COMMENT','REVIEW','VISIT','VISIT_STREAK','RECOMMEND','NOT_RECOMMEND','REPORTED')")
    private LevelActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, columnDefinition = "ENUM('EARN','REVERSAL')")
    private LevelEntryType entryType;

    @Column(name = "exp_delta", nullable = false)
    private short expDelta;
    @Column(name = "ref_type", length = 20)
    private String refType;
    @Column(name = "ref_id")
    private Long refId;
    @Column(name = "actor_user_id")
    private Long actorUserId;
    @Column(name = "event_key", nullable = false, length = 191)
    private String eventKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_log_id")
    private UserLevelLog originalLog;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Builder
    private UserLevelLog(User user, LevelActionType actionType, LevelEntryType entryType,
                         int expDelta, String refType, Long refId, Long actorUserId,
                         String eventKey, UserLevelLog originalLog, LocalDate activityDate) {
        this.user = user;
        this.actionType = actionType;
        this.entryType = entryType;
        this.expDelta = (short) expDelta;
        this.refType = refType;
        this.refId = refId;
        this.actorUserId = actorUserId;
        this.eventKey = eventKey;
        this.originalLog = originalLog;
        this.activityDate = activityDate;
    }
}
