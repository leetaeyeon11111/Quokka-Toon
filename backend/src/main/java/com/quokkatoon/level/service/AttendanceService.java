package com.quokkatoon.level.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.level.config.LevelTimeConfig;
import com.quokkatoon.level.entity.LevelActionType;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AttendanceService {
    private final UserRepository userRepository;
    private final ExperienceService experienceService;
    private final Clock levelClock;

    @Transactional
    public void processFirstMeCallOfDay(Long userId) {
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        LocalDateTime now = LocalDateTime.now(levelClock.withZone(LevelTimeConfig.KST));
        LocalDate today = now.toLocalDate();
        LocalDate previousVisit = user.getLastVisitAt() == null ? null : user.getLastVisitAt().toLocalDate();
        if (today.equals(previousVisit)) return;

        int streak = previousVisit != null && previousVisit.equals(today.minusDays(1))
                ? user.getConsecutiveVisitDays() + 1 : 1;
        user.recordVisit(now, streak);

        String suffix = userId + ":" + today;
        experienceService.awardLocked(user, LevelActionType.VISIT, 1,
                "VISIT", null, userId, "VISIT:" + suffix, today);
        if (streak >= 2) {
            experienceService.awardLocked(user, LevelActionType.VISIT_STREAK, 2,
                    "VISIT", null, userId, "VISIT_STREAK:" + suffix, today);
        }
    }
}
