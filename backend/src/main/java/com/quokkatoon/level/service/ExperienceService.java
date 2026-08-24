package com.quokkatoon.level.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.level.config.LevelTimeConfig;
import com.quokkatoon.level.dto.ExpChangeResponse;
import com.quokkatoon.level.dto.ExperienceLogResponse;
import com.quokkatoon.level.dto.LevelProgressResponse;
import com.quokkatoon.level.entity.LevelActionType;
import com.quokkatoon.level.entity.LevelEntryType;
import com.quokkatoon.level.entity.UserLevelLog;
import com.quokkatoon.level.repository.UserLevelLogRepository;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExperienceService {
    private static final Map<LevelActionType, Integer> DAILY_ACTION_LIMITS = Map.of(
            LevelActionType.POST, 2, LevelActionType.COMMENT, 3, LevelActionType.REVIEW, 2);
    private static final int RECOMMENDATION_DAILY_CAP = 10;

    private final UserRepository userRepository;
    private final UserLevelLogRepository logRepository;
    private final LevelPolicy levelPolicy;
    private final Clock levelClock;

    @Transactional
    public ExpChangeResponse award(Long userId, LevelActionType actionType, int requestedExp,
                                   String refType, Long refId, Long actorUserId, String eventKey) {
        User user = lockUser(userId);
        return awardLocked(user, actionType, requestedExp, refType, refId, actorUserId, eventKey, today());
    }

    public ExpChangeResponse awardLocked(User user, LevelActionType actionType, int requestedExp,
                                         String refType, Long refId, Long actorUserId,
                                         String eventKey, LocalDate activityDate) {
        int todayExp = logRepository.sumPositiveExp(user.getId(), activityDate);
        if (logRepository.findByEventKey(eventKey).isPresent()) {
            return ExpChangeResponse.unchanged(user.getLevel(), todayExp >= LevelPolicy.DAILY_EXP_CAP);
        }
        int grant = Math.max(0, requestedExp);
        Integer actionLimit = DAILY_ACTION_LIMITS.get(actionType);
        if (actionLimit != null) {
            long used = logRepository.countByUserIdAndActionTypeAndEntryTypeAndActivityDate(
                    user.getId(), actionType, LevelEntryType.EARN, activityDate);
            if (used >= actionLimit) grant = 0;
        }
        if (actionType == LevelActionType.RECOMMEND) {
            int recommendationExp = logRepository.sumRecommendationExp(user.getId(), activityDate);
            grant = Math.min(grant, Math.max(0, RECOMMENDATION_DAILY_CAP - recommendationExp));
        }
        grant = Math.min(grant, Math.max(0, LevelPolicy.DAILY_EXP_CAP - todayExp));

        logRepository.save(UserLevelLog.builder()
                .user(user).actionType(actionType).entryType(LevelEntryType.EARN).expDelta(grant)
                .refType(refType).refId(refId).actorUserId(actorUserId).eventKey(eventKey)
                .activityDate(activityDate).build());

        int previousLevel = user.getLevel();
        int newExp = Math.max(0, user.getExp() + grant);
        int newLevel = levelPolicy.levelForExp(newExp);
        user.updateExperience(newExp, newLevel);
        int updatedTodayExp = todayExp + grant;
        return new ExpChangeResponse(grant, grant, previousLevel, newLevel,
                previousLevel != newLevel, newLevel > previousLevel,
                updatedTodayExp >= LevelPolicy.DAILY_EXP_CAP);
    }

    @Transactional
    public ExpChangeResponse reverseEvent(Long userId, String awardEventKey, String reversalEventKey) {
        User user = lockUser(userId);
        UserLevelLog original = logRepository.findByEventKey(awardEventKey).orElse(null);
        if (original == null || original.getEntryType() != LevelEntryType.EARN
                || original.getExpDelta() <= 0 || logRepository.existsByOriginalLogId(original.getId())) {
            return ExpChangeResponse.unchanged(user.getLevel(), todayExp(userId) >= LevelPolicy.DAILY_EXP_CAP);
        }
        return reverseLocked(user, original, reversalEventKey);
    }

    @Transactional
    public ExpChangeResponse awardRecommendation(Long userId, String refType, Long refId, Long actorUserId) {
        User user = lockUser(userId);
        List<UserLevelLog> active = logRepository.findActiveRecommendationAwards(
                userId, refType, refId, actorUserId);
        if (!active.isEmpty()) {
            return ExpChangeResponse.unchanged(user.getLevel(), todayExp(userId) >= LevelPolicy.DAILY_EXP_CAP);
        }
        long cycle = logRepository.countByUserIdAndActionTypeAndRefTypeAndRefIdAndActorUserIdAndEntryType(
                userId, LevelActionType.RECOMMEND, refType, refId, actorUserId, LevelEntryType.EARN) + 1;
        String eventKey = recommendationEvent(refType, refId, actorUserId, cycle);
        return awardLocked(user, LevelActionType.RECOMMEND, 1, refType, refId,
                actorUserId, eventKey, today());
    }

    @Transactional
    public ExpChangeResponse reverseRecommendation(Long userId, String refType, Long refId, Long actorUserId) {
        User user = lockUser(userId);
        List<UserLevelLog> active = logRepository.findActiveRecommendationAwards(
                userId, refType, refId, actorUserId);
        if (active.isEmpty()) {
            return ExpChangeResponse.unchanged(user.getLevel(), todayExp(userId) >= LevelPolicy.DAILY_EXP_CAP);
        }
        UserLevelLog original = active.get(0);
        return reverseLocked(user, original, "REVERSAL:" + original.getEventKey());
    }

    @Transactional
    public ExpChangeResponse reverseAllForReference(String refType, Long refId) {
        List<UserLevelLog> awards = logRepository.findUnreversedAwardsForReference(refType, refId);
        ExpChangeResponse last = null;
        for (UserLevelLog award : awards) {
            User user = lockUser(award.getUser().getId());
            last = reverseLocked(user, award, "REVERSAL:" + award.getEventKey());
        }
        return last;
    }

    private ExpChangeResponse reverseLocked(User user, UserLevelLog original, String reversalEventKey) {
        if (logRepository.findByEventKey(reversalEventKey).isPresent()
                || logRepository.existsByOriginalLogId(original.getId())) {
            return ExpChangeResponse.unchanged(user.getLevel(), todayExp(user.getId()) >= LevelPolicy.DAILY_EXP_CAP);
        }
        int actualReversal = Math.min(original.getExpDelta(), user.getExp());
        logRepository.save(UserLevelLog.builder()
                .user(user).actionType(original.getActionType()).entryType(LevelEntryType.REVERSAL)
                .expDelta(-actualReversal).refType(original.getRefType()).refId(original.getRefId())
                .actorUserId(original.getActorUserId()).eventKey(reversalEventKey).originalLog(original)
                .activityDate(today()).build());

        int previousLevel = user.getLevel();
        int newExp = Math.max(0, user.getExp() - actualReversal);
        int newLevel = levelPolicy.levelForExp(newExp);
        user.updateExperience(newExp, newLevel);
        return new ExpChangeResponse(-actualReversal, 0, previousLevel, newLevel,
                previousLevel != newLevel, false,
                todayExp(user.getId()) >= LevelPolicy.DAILY_EXP_CAP);
    }

    @Transactional(readOnly = true)
    public LevelProgressResponse getProgress(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return levelPolicy.progress(user.getExp(), todayExp(userId));
    }

    @Transactional(readOnly = true)
    public int todayExp(Long userId) {
        return logRepository.sumPositiveExp(userId, today());
    }

    @Transactional(readOnly = true)
    public List<ExperienceLogResponse> getRecentEarnings(Long userId, int requestedLimit) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        int limit = Math.max(1, Math.min(20, requestedLimit));
        return logRepository.findRecentPositiveEarnings(userId, PageRequest.of(0, limit)).stream()
                .map(ExperienceLogResponse::from)
                .toList();
    }

    public LocalDate today() {
        return LocalDate.now(levelClock.withZone(LevelTimeConfig.KST));
    }

    private User lockUser(Long userId) {
        return userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private String recommendationEvent(String refType, Long refId, Long actorUserId, long cycle) {
        return "RECOMMEND:" + refType + ":" + refId + ":BY:" + actorUserId + ":CYCLE:" + cycle;
    }
}
