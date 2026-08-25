package com.quokkatoon.report.repository;

import com.quokkatoon.report.entity.UserBan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserBanRepository extends JpaRepository<UserBan, Long> {
    Optional<UserBan> findTopByUserIdOrderByCreatedAtDesc(Long userId);
}
