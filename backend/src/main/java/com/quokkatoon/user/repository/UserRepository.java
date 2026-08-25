package com.quokkatoon.user.repository;

import com.quokkatoon.user.entity.Role;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    List<User> findByRoleOrderByCreatedAtDesc(Role role);

    List<User> findByStatusOrderByUpdatedAtDesc(UserStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);
}
