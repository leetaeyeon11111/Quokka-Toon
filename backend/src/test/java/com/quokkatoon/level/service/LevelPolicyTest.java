package com.quokkatoon.level.service;

import com.quokkatoon.level.dto.LevelProgressResponse;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class LevelPolicyTest {
    private final LevelPolicy policy = new LevelPolicy();

    @Test
    void majorThresholdsMatchThePublishedPolicy() {
        Map<Integer, Integer> thresholds = Map.ofEntries(
                Map.entry(1, 0), Map.entry(2, 20), Map.entry(3, 50), Map.entry(4, 90),
                Map.entry(5, 140), Map.entry(10, 460), Map.entry(20, 1_250),
                Map.entry(30, 2_240), Map.entry(40, 3_430), Map.entry(50, 4_820),
                Map.entry(60, 6_410), Map.entry(70, 8_200), Map.entry(80, 10_190),
                Map.entry(90, 12_380), Map.entry(100, 14_770));
        thresholds.forEach((level, exp) -> {
            assertThat(policy.thresholdForLevel(level)).isEqualTo(exp);
            assertThat(policy.levelForExp(exp)).isEqualTo(level);
        });
    }

    @Test
    void handlesNinetyNineToOneHundredAndKeepsExpAfterMax() {
        assertThat(policy.levelForExp(14_769)).isEqualTo(99);
        assertThat(policy.levelForExp(14_770)).isEqualTo(100);
        LevelProgressResponse max = policy.progress(20_000, 20);
        assertThat(max.level()).isEqualTo(100);
        assertThat(max.exp()).isEqualTo(20_000);
        assertThat(max.progressPercent()).isEqualTo(100);
        assertThat(max.maxLevel()).isTrue();
    }

    @Test
    void supportsMultiLevelChangesFloorAndCurrentBandProgress() {
        assertThat(policy.levelForExp(1_250)).isEqualTo(20);
        assertThat(policy.levelForExp(19)).isEqualTo(1);
        assertThat(policy.levelForExp(-100)).isEqualTo(1);

        LevelProgressResponse progress = policy.progress(35, 7);
        assertThat(progress.level()).isEqualTo(2);
        assertThat(progress.currentLevelExp()).isEqualTo(20);
        assertThat(progress.nextLevelExp()).isEqualTo(50);
        assertThat(progress.expIntoLevel()).isEqualTo(15);
        assertThat(progress.expNeededForNextLevel()).isEqualTo(30);
        assertThat(progress.progressPercent()).isEqualTo(50);
        assertThat(progress.todayExp()).isEqualTo(7);
    }
}
