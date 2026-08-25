package com.quokkatoon.level.dto;

import com.quokkatoon.level.entity.LevelActionType;
import com.quokkatoon.level.entity.UserLevelLog;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExperienceLogResponse(
        Long id,
        LevelActionType actionType,
        int expDelta,
        LocalDate activityDate,
        LocalDateTime createdAt
) {
    public static ExperienceLogResponse from(UserLevelLog log) {
        return new ExperienceLogResponse(
                log.getId(),
                log.getActionType(),
                log.getExpDelta(),
                log.getActivityDate(),
                log.getCreatedAt()
        );
    }
}
