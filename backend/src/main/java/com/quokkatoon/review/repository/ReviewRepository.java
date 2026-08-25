package com.quokkatoon.review.repository;

import com.quokkatoon.review.entity.Review;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByWebtoonIdAndDeletedFalseOrderByLikeCountDescCreatedAtDesc(Long webtoonId);
    Optional<Review> findByUserIdAndWebtoonId(Long userId, Long webtoonId);

    // 내가 쓴 리뷰 (웹툰 정보까지 함께 로딩). 삭제된 리뷰는 제외.
    @Query("select r from Review r join fetch r.webtoon "
            + "where r.user.id = :userId and r.deleted = false order by r.createdAt desc")
    List<Review> findMyReviews(@Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Review r where r.id = :id")
    Optional<Review> findByIdForUpdate(@Param("id") Long id);
}
