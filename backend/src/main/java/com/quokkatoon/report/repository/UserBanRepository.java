package com.quokkatoon.report.repository;

import com.quokkatoon.report.entity.UserBan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBanRepository extends JpaRepository<UserBan, Long> {
}
