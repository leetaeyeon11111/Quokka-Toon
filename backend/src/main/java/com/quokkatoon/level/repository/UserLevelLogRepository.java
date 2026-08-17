package com.quokkatoon.level.repository;

import com.quokkatoon.level.entity.LevelActionType;
import com.quokkatoon.level.entity.LevelEntryType;
import com.quokkatoon.level.entity.UserLevelLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserLevelLogRepository extends JpaRepository<UserLevelLog, Long> {
    Optional<UserLevelLog> findByEventKey(String eventKey);
    boolean existsByOriginalLogId(Long originalLogId);

    long countByUserIdAndActionTypeAndEntryTypeAndActivityDate(
            Long userId, LevelActionType actionType, LevelEntryType entryType, LocalDate activityDate);

    @Query("select coalesce(sum(l.expDelta), 0) from UserLevelLog l " +
            "where l.user.id = :userId and l.entryType = com.quokkatoon.level.entity.LevelEntryType.EARN " +
            "and l.activityDate = :activityDate and l.expDelta > 0")
    int sumPositiveExp(@Param("userId") Long userId, @Param("activityDate") LocalDate activityDate);

    @Query("select coalesce(sum(l.expDelta), 0) from UserLevelLog l " +
            "where l.user.id = :userId and l.actionType = com.quokkatoon.level.entity.LevelActionType.RECOMMEND " +
            "and l.entryType = com.quokkatoon.level.entity.LevelEntryType.EARN " +
            "and l.activityDate = :activityDate and l.expDelta > 0")
    int sumRecommendationExp(@Param("userId") Long userId, @Param("activityDate") LocalDate activityDate);

    @Query("select l from UserLevelLog l where l.user.id = :userId " +
            "and l.actionType = com.quokkatoon.level.entity.LevelActionType.RECOMMEND " +
            "and l.refType = :refType and l.refId = :refId and l.actorUserId = :actorUserId " +
            "and l.entryType = com.quokkatoon.level.entity.LevelEntryType.EARN " +
            "and not exists (select r.id from UserLevelLog r where r.originalLog = l) order by l.id desc")
    List<UserLevelLog> findActiveRecommendationAwards(@Param("userId") Long userId,
            @Param("refType") String refType, @Param("refId") Long refId,
            @Param("actorUserId") Long actorUserId);

    long countByUserIdAndActionTypeAndRefTypeAndRefIdAndActorUserIdAndEntryType(
            Long userId, LevelActionType actionType, String refType, Long refId,
            Long actorUserId, LevelEntryType entryType);

    @Query("select l from UserLevelLog l where l.refType = :refType and l.refId = :refId " +
            "and l.entryType = com.quokkatoon.level.entity.LevelEntryType.EARN " +
            "and not exists (select r.id from UserLevelLog r where r.originalLog = l) order by l.id")
    List<UserLevelLog> findUnreversedAwardsForReference(
            @Param("refType") String refType, @Param("refId") Long refId);
}
