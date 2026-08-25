package com.quokkatoon.board.repository;

import com.quokkatoon.board.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdAndDeletedFalseOrderByCreatedAtAsc(Long postId);

    long countByPostIdAndDeletedFalse(Long postId);

    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    @Query("""
            SELECT c FROM Comment c
            JOIN FETCH c.post p
            JOIN FETCH p.category
            WHERE c.user.id = :userId AND c.deleted = false
            ORDER BY c.createdAt DESC
            """)
    List<Comment> findMyComments(@Param("userId") Long userId);
}
