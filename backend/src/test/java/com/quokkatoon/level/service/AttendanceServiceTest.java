package com.quokkatoon.level.service;

import com.quokkatoon.level.entity.LevelActionType;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AttendanceServiceTest {
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Test
    void sameDayIsIdempotentAndConsecutiveVisitIncreases() {
        User user = user(1L);
        ReflectionTestUtils.setField(user, "lastVisitAt", LocalDateTime.of(2026, 8, 17, 12, 0));
        ReflectionTestUtils.setField(user, "consecutiveVisitDays", 1);
        UserRepository users = mock(UserRepository.class);
        ExperienceService experience = mock(ExperienceService.class);
        when(users.findByIdForUpdate(1L)).thenReturn(Optional.of(user));
        AttendanceService service = new AttendanceService(users, experience,
                Clock.fixed(Instant.parse("2026-08-17T15:01:00Z"), KST));

        service.processFirstMeCallOfDay(1L);
        assertThat(user.getConsecutiveVisitDays()).isEqualTo(2);
        verify(experience).awardLocked(eq(user), eq(LevelActionType.VISIT), eq(1),
                eq("VISIT"), isNull(), eq(1L), anyString(), eq(LocalDate.of(2026, 8, 18)));
        verify(experience).awardLocked(eq(user), eq(LevelActionType.VISIT_STREAK), eq(2),
                eq("VISIT"), isNull(), eq(1L), anyString(), eq(LocalDate.of(2026, 8, 18)));

        reset(experience);
        service.processFirstMeCallOfDay(1L);
        verifyNoInteractions(experience);
    }

    @Test
    void brokenStreakResetsAndKstMidnightDefinesTheDate() {
        User user = user(2L);
        ReflectionTestUtils.setField(user, "lastVisitAt", LocalDateTime.of(2026, 8, 15, 23, 59));
        ReflectionTestUtils.setField(user, "consecutiveVisitDays", 8);
        UserRepository users = mock(UserRepository.class);
        ExperienceService experience = mock(ExperienceService.class);
        when(users.findByIdForUpdate(2L)).thenReturn(Optional.of(user));
        AttendanceService service = new AttendanceService(users, experience,
                Clock.fixed(Instant.parse("2026-08-17T15:00:00Z"), KST));

        service.processFirstMeCallOfDay(2L);
        assertThat(user.getConsecutiveVisitDays()).isEqualTo(1);
        assertThat(user.getLastVisitAt().toLocalDate()).isEqualTo(LocalDate.of(2026, 8, 18));
        verify(experience, never()).awardLocked(eq(user), eq(LevelActionType.VISIT_STREAK), anyInt(),
                any(), any(), any(), any(), any());
    }

    private User user(Long id) {
        User user = User.builder().email("user" + id + "@test.com").passwordHash("x")
                .nickname("user" + id).build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
