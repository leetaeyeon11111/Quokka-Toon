package com.quokkatoon.board.repository;

import com.quokkatoon.board.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByDeletedFalseOrderByCreatedAtDesc();

    List<Post> findByCategoryCodeAndDeletedFalseOrderByCreatedAtDesc(String code);

    List<Post> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Post p where p.id = :id")
    java.util.Optional<Post> findByIdForUpdate(@Param("id") Long id);
}
