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

    // 내가 쓴 댓글 (게시글 정보까지 함께 로딩). 삭제된 댓글·삭제된 게시글은 제외.
    @Query("select c from Comment c join fetch c.post p join fetch p.category "
            + "where c.user.id = :userId and c.deleted = false and p.deleted = false "
            + "order by c.createdAt desc")
    List<Comment> findMyComments(@Param("userId") Long userId);
}
