package com.quokkatoon.user.dto;

import com.quokkatoon.user.entity.Gender;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.profile.DefaultProfileIcon;
import com.quokkatoon.level.dto.LevelProgressResponse;

import java.time.LocalDate;

// 현재 로그인한 회원의 정보 (GET /api/auth/me)
public record UserResponse(
        Long userId,
        String email,
        String nickname,
        String profileImageUrl,
        String profileIconId,
        Gender gender,
        LocalDate birthDate,
        int level,
        int exp,
        int currentLevelExp,
        int nextLevelExp,
        int expIntoLevel,
        int expNeededForNextLevel,
        int progressPercent,
        int todayExp,
        int dailyExpCap,
        boolean maxLevel,
        int warningCount,
        String role
) {
    public static UserResponse from(User user, LevelProgressResponse progress) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getProfileImageUrl(),
                DefaultProfileIcon.fromImageUrl(user.getProfileImageUrl())
                        .map(DefaultProfileIcon::id)
                        .orElse(null),
                user.getGender(),
                user.getBirthDate(),
                user.getLevel(),
                user.getExp(),
                progress.currentLevelExp(),
                progress.nextLevelExp(),
                progress.expIntoLevel(),
                progress.expNeededForNextLevel(),
                progress.progressPercent(),
                progress.todayExp(),
                progress.dailyExpCap(),
                progress.maxLevel(),
                user.getWarningCount(),
                user.getRole().name()
        );
    }
}
