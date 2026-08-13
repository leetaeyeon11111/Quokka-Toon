package com.quokkatoon.board.repository;

import com.quokkatoon.board.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByDeletedFalseOrderByCreatedAtDesc();

    List<Post> findByCategoryCodeAndDeletedFalseOrderByCreatedAtDesc(String code);

    List<Post> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId);
}
