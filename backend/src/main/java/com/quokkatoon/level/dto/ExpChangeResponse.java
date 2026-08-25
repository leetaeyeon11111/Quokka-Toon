package com.quokkatoon.level.dto;

public record ExpChangeResponse(
        int expDelta, int awardedExp, int previousLevel, int currentLevel,
        boolean levelChanged, boolean levelUp, boolean dailyCapReached
) {
    public static ExpChangeResponse unchanged(int level, boolean dailyCapReached) {
        return new ExpChangeResponse(0, 0, level, level, false, false, dailyCapReached);
    }
}
