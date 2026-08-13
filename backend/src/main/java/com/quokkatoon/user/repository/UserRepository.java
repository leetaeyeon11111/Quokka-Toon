package com.quokkatoon.user.repository;

import com.quokkatoon.user.entity.Role;
import com.quokkatoon.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    List<User> findByRoleOrderByCreatedAtDesc(Role role);
}
