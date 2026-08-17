package com.quokkatoon.board.repository;

import com.quokkatoon.board.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdAndDeletedFalseOrderByCreatedAtAsc(Long postId);

    long countByPostIdAndDeletedFalse(Long postId);

    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);
}
