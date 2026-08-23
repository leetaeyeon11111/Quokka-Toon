package com.quokkatoon.level.service;

import com.quokkatoon.level.dto.ExpChangeResponse;
import com.quokkatoon.level.entity.LevelActionType;
import com.quokkatoon.level.entity.LevelEntryType;
import com.quokkatoon.level.entity.UserLevelLog;
import com.quokkatoon.level.repository.UserLevelLogRepository;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:leveltest;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false"
})
class ExperienceServiceIntegrationTest {
    @Autowired ExperienceService experienceService;
    @Autowired AttendanceService attendanceService;
    @Autowired UserRepository userRepository;
    @Autowired UserLevelLogRepository logRepository;

    @BeforeEach
    void clean() {
        logRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void postCommentAndReviewDailyCountsAreEnforced() {
        User postUser = saveUser("post");
        assertThat(awards(postUser, LevelActionType.POST, 4, 3, "POST")).containsExactly(4, 4, 0);
        experienceService.reverseAllForReference("POST", 0L);
        assertThat(experienceService.award(postUser.getId(), LevelActionType.POST, 4,
                "POST", 4L, postUser.getId(), "POST:AFTER_REVERSAL").awardedExp()).isZero();

        User commentUser = saveUser("comment");
        assertThat(awards(commentUser, LevelActionType.COMMENT, 3, 4, "COMMENT"))
                .containsExactly(3, 3, 3, 0);

        User reviewUser = saveUser("review");
        assertThat(awards(reviewUser, LevelActionType.REVIEW, 5, 3, "REVIEW"))
                .containsExactly(5, 5, 0);
    }

    @Test
    void zeroGrantRemainsAnIdempotencyRecordButIsNeverReversed() {
        User user = saveUser("zero-grant");
        assertThat(awards(user, LevelActionType.POST, 4, 3, "ZERO_POST"))
                .containsExactly(4, 4, 0);

        assertThat(experienceService.reverseAllForReference("ZERO_POST", 2L)).isNull();
        List<UserLevelLog> referenceLogs = logRepository.findAll().stream()
                .filter(log -> "ZERO_POST".equals(log.getRefType()) && Long.valueOf(2L).equals(log.getRefId()))
                .toList();
        assertThat(referenceLogs).singleElement()
                .satisfies(log -> {
                    assertThat(log.getEntryType()).isEqualTo(LevelEntryType.EARN);
                    assertThat(log.getExpDelta()).isZero();
                });
    }

    @Test
    void recommendationAndOverallCapsIncludePartialGrant() {
        User recommended = saveUser("recommended");
        assertThat(awards(recommended, LevelActionType.RECOMMEND, 1, 12, "REC").stream()
                .mapToInt(Integer::intValue).sum()).isEqualTo(10);

        User capped = saveUser("capped");
        awards(capped, LevelActionType.COMMENT, 3, 3, "C"); // 9
        awards(capped, LevelActionType.POST, 4, 2, "P"); // 17
        ExpChangeResponse partial = experienceService.award(capped.getId(), LevelActionType.REVIEW, 5,
                "REVIEW", 1L, capped.getId(), "PARTIAL");
        assertThat(partial.awardedExp()).isEqualTo(3);
        assertThat(partial.dailyCapReached()).isTrue();
        assertThat(userRepository.findById(capped.getId()).orElseThrow().getExp()).isEqualTo(20);
        ExpChangeResponse partialReversal = experienceService.reverseAllForReference("REVIEW", 1L);
        assertThat(partialReversal.expDelta()).isEqualTo(-3);
        ExpChangeResponse afterReversal = experienceService.award(capped.getId(), LevelActionType.VISIT, 1,
                "VISIT", 2L, capped.getId(), "AFTER_DAILY_REVERSAL");
        assertThat(afterReversal.awardedExp()).isZero();
    }

    @Test
    void differentRecommendersCanEarnAndToggleCannotExceedOneNetExp() {
        User user = saveUser("likes");
        ExpChangeResponse first = experienceService.awardRecommendation(user.getId(), "POST", 10L, 101L);
        ExpChangeResponse second = experienceService.awardRecommendation(user.getId(), "POST", 10L, 102L);
        assertThat(first.awardedExp() + second.awardedExp()).isEqualTo(2);

        ExpChangeResponse reversal = experienceService.reverseRecommendation(user.getId(), "POST", 10L, 101L);
        ExpChangeResponse repeatedLike = experienceService.awardRecommendation(user.getId(), "POST", 10L, 101L);
        ExpChangeResponse duplicateActiveLike = experienceService.awardRecommendation(user.getId(), "POST", 10L, 101L);
        assertThat(reversal.expDelta()).isEqualTo(-1);
        assertThat(repeatedLike.awardedExp()).isEqualTo(1);
        assertThat(duplicateActiveLike.awardedExp()).isZero();
        assertThat(userRepository.findById(user.getId()).orElseThrow().getExp()).isEqualTo(2);
    }

    @Test
    void deletionReversesOnlyActualGrantOnceAndCanLowerMultipleLevelsWithoutGoingNegative() {
        User user = saveUser("reversal");
        user.updateExperience(100, 4);
        userRepository.save(user);
        experienceService.award(user.getId(), LevelActionType.POST, 4,
                "POST", 99L, user.getId(), "POST_CREATE:99");
        ExpChangeResponse first = experienceService.reverseAllForReference("POST", 99L);
        ExpChangeResponse second = experienceService.reverseAllForReference("POST", 99L);
        assertThat(first.expDelta()).isEqualTo(-4);
        assertThat(second).isNull();
        assertThat(userRepository.findById(user.getId()).orElseThrow().getExp()).isEqualTo(100);

        User floor = saveUser("floor");
        experienceService.award(floor.getId(), LevelActionType.POST, 4,
                "POST", 100L, floor.getId(), "POST_CREATE:100");
        floor = userRepository.findById(floor.getId()).orElseThrow();
        floor.updateExperience(1, 1);
        userRepository.save(floor);
        experienceService.reverseEvent(floor.getId(), "POST_CREATE:100", "REVERSAL:POST_CREATE:100");
        assertThat(userRepository.findById(floor.getId()).orElseThrow().getExp()).isZero();

        User multi = saveUser("multi-down");
        multi.updateExperience(500, 10);
        userRepository.saveAndFlush(multi);
        logRepository.saveAndFlush(UserLevelLog.builder().user(multi).actionType(LevelActionType.POST)
                .entryType(LevelEntryType.EARN).expDelta(500).refType("POST").refId(555L)
                .actorUserId(multi.getId()).eventKey("MANUAL_MULTI_LEVEL")
                .activityDate(experienceService.today()).build());
        ExpChangeResponse multiLevelDown = experienceService.reverseAllForReference("POST", 555L);
        assertThat(multiLevelDown.previousLevel()).isEqualTo(10);
        assertThat(multiLevelDown.currentLevel()).isEqualTo(1);
        assertThat(userRepository.findById(multi.getId()).orElseThrow().getExp()).isZero();
    }

    @Test
    void concurrentDuplicateEventIsGrantedOnce() throws Exception {
        User user = saveUser("concurrent");
        int workers = 8;
        ExecutorService executor = Executors.newFixedThreadPool(workers);
        CountDownLatch ready = new CountDownLatch(workers);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<ExpChangeResponse>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < workers; i++) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    return experienceService.award(user.getId(), LevelActionType.POST, 4,
                            "POST", 777L, user.getId(), "POST_CREATE:777");
                }));
            }
            ready.await();
            start.countDown();
            int awarded = 0;
            for (Future<ExpChangeResponse> future : futures) awarded += future.get().awardedExp();
            assertThat(awarded).isEqualTo(4);
            assertThat(userRepository.findById(user.getId()).orElseThrow().getExp()).isEqualTo(4);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void concurrentFirstVisitIsRecordedOnce() throws Exception {
        User user = saveUser("visit");
        int workers = 6;
        ExecutorService executor = Executors.newFixedThreadPool(workers);
        CountDownLatch ready = new CountDownLatch(workers);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < workers; i++) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    attendanceService.processFirstMeCallOfDay(user.getId());
                    return null;
                }));
            }
            ready.await();
            start.countDown();
            for (Future<?> future : futures) future.get();
            User visited = userRepository.findById(user.getId()).orElseThrow();
            assertThat(visited.getExp()).isEqualTo(1);
            assertThat(visited.getConsecutiveVisitDays()).isEqualTo(1);
        } finally {
            executor.shutdownNow();
        }
    }

    private List<Integer> awards(User user, LevelActionType action, int amount, int count, String prefix) {
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            result.add(experienceService.award(user.getId(), action, amount,
                    prefix, (long) i, user.getId(), prefix + ":" + user.getId() + ":" + i).awardedExp());
        }
        return result;
    }

    private User saveUser(String name) {
        return userRepository.saveAndFlush(User.builder()
                .email(name + "@test.com").passwordHash("x").nickname(name).build());
    }
}
