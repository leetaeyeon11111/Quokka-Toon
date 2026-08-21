package com.quokkatoon.level.service;

import com.quokkatoon.level.dto.LevelProgressResponse;
import org.springframework.stereotype.Component;

@Component
public class LevelPolicy {
    public static final int MAX_LEVEL = 100;
    public static final int DAILY_EXP_CAP = 20;
    public static final int MAX_LEVEL_EXP = 14_770;

    public int thresholdForLevel(int level) {
        if (level <= 1) return 0;
        if (level == 2) return 20;
        if (level == 3) return 50;
        if (level == 4) return 90;
        int cappedLevel = Math.min(level, MAX_LEVEL);
        return cappedLevel * cappedLevel + 49 * cappedLevel - 130;
    }

    public int levelForExp(int exp) {
        int safeExp = Math.max(0, exp);
        if (safeExp >= MAX_LEVEL_EXP) return MAX_LEVEL;
        int low = 1;
        int high = MAX_LEVEL - 1;
        while (low <= high) {
            int mid = (low + high) >>> 1;
            if (thresholdForLevel(mid) <= safeExp) low = mid + 1;
            else high = mid - 1;
        }
        return Math.max(1, high);
    }

    public LevelProgressResponse progress(int exp, int todayExp) {
        int safeExp = Math.max(0, exp);
        int level = levelForExp(safeExp);
        int current = thresholdForLevel(level);
        if (level == MAX_LEVEL) {
            return new LevelProgressResponse(level, safeExp, current, current,
                    Math.max(0, safeExp - current), 0, 100,
                    Math.max(0, todayExp), DAILY_EXP_CAP, true);
        }
        int next = thresholdForLevel(level + 1);
        int into = safeExp - current;
        int needed = next - current;
        int percent = (int) Math.floor((into * 100.0) / needed);
        return new LevelProgressResponse(level, safeExp, current, next, into, needed,
                Math.max(0, Math.min(100, percent)), Math.max(0, todayExp), DAILY_EXP_CAP, false);
    }
}
