package com.quokkatoon.user.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 관리자 승격 요청. 유저당 1행(재요청 시 상태만 PENDING 으로 되돌림)
@Getter
@Entity
@Table(name = "admin_request")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminRequest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('PENDING','APPROVED','REJECTED')")
    private AdminRequestStatus status = AdminRequestStatus.PENDING;

    @Builder
    private AdminRequest(User user) {
        this.user = user;
        this.status = AdminRequestStatus.PENDING;
    }

    public void reopen() { this.status = AdminRequestStatus.PENDING; }
    public void approve() { this.status = AdminRequestStatus.APPROVED; }
    public void reject()  { this.status = AdminRequestStatus.REJECTED; }
}
