package com.quokkatoon.user.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 소셜 계정 연동. (provider, provider_uid) 유니크로 "이 소셜 사용자"를 식별
@Getter
@Entity
@Table(name = "social_account")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SocialAccount extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "social_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('KAKAO','NAVER')")
    private SocialProvider provider;

    @Column(name = "provider_uid", nullable = false, length = 255)
    private String providerUid;

    @Builder
    private SocialAccount(User user, SocialProvider provider, String providerUid) {
        this.user = user;
        this.provider = provider;
        this.providerUid = providerUid;
    }
}
