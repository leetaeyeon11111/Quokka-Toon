package com.quokkatoon.level.dto;

public record LevelProgressResponse(
        int level, int exp, int currentLevelExp, int nextLevelExp,
        int expIntoLevel, int expNeededForNextLevel, int progressPercent,
        int todayExp, int dailyExpCap, boolean maxLevel
) {}
