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

    long countByWebtoonIdAndDeletedFalse(Long webtoonId);

    @Query("select avg(r.rating) from Review r where r.webtoon.id = :webtoonId and r.deleted = false")
    Double averageRatingByWebtoonId(@Param("webtoonId") Long webtoonId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Review r where r.id = :id")
    Optional<Review> findByIdForUpdate(@Param("id") Long id);
}
