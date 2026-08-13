package com.quokkatoon.user.repository;

import com.quokkatoon.user.entity.AdminRequest;
import com.quokkatoon.user.entity.AdminRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminRequestRepository extends JpaRepository<AdminRequest, Long> {

    Optional<AdminRequest> findByUserId(Long userId);

    List<AdminRequest> findByStatusOrderByCreatedAtDesc(AdminRequestStatus status);
}
