package com.quokkatoon.user.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "`user`")   // user 는 MySQL 예약어이므로 백틱
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;   // 소셜 전용 계정은 null

    @Column(nullable = false, unique = true, length = 30)
    private String nickname;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('M','F','NONE')")
    private Gender gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(nullable = false)
    private int level = 1;

    @Column(nullable = false)
    private int exp = 0;

    @Column(name = "warning_count", nullable = false, columnDefinition = "TINYINT")
    private int warningCount = 0;

    @Column(name = "report_count", nullable = false)
    private int reportCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('USER','ADMIN')")
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('ACTIVE','BANNED','WITHDRAWN')")
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "last_visit_at")
    private LocalDateTime lastVisitAt;

    @Column(name = "consecutive_visit_days", nullable = false)
    private int consecutiveVisitDays = 0;

    @Builder
    private User(String email, String passwordHash, String nickname,
                 Gender gender, LocalDate birthDate) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.gender = gender;
        this.birthDate = birthDate;
        this.role = Role.USER;
        this.status = UserStatus.ACTIVE;
        this.level = 1;
    }

    public boolean isBanned() {
        return this.status == UserStatus.BANNED;
    }
}
