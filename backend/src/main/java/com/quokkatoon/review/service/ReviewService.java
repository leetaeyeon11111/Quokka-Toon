package com.quokkatoon.review.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.global.validation.ContentValidator;
import com.quokkatoon.level.dto.ActionResponse;
import com.quokkatoon.level.dto.ExpChangeResponse;
import com.quokkatoon.level.entity.LevelActionType;
import com.quokkatoon.level.service.ExperienceService;
import com.quokkatoon.review.dto.MyReviewItem;
import com.quokkatoon.review.dto.ReviewLikeResponse;
import com.quokkatoon.review.dto.ReviewRequest;
import com.quokkatoon.review.dto.ReviewResponse;
import com.quokkatoon.review.entity.Review;
import com.quokkatoon.review.entity.ReviewLike;
import com.quokkatoon.review.repository.ReviewLikeRepository;
import com.quokkatoon.review.repository.ReviewRepository;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import com.quokkatoon.webtoon.entity.Webtoon;
import com.quokkatoon.webtoon.repository.WebtoonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final UserRepository userRepository;
    private final WebtoonRepository webtoonRepository;
    private final ExperienceService experienceService;

    // 내가 쓴 리뷰 (마이페이지)
    @Transactional(readOnly = true)
    public List<MyReviewItem> getMyReviews(Long userId) {
        return reviewRepository.findMyReviews(userId).stream()
                .map(MyReviewItem::of).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviews(Long webtoonId, Long currentUserId) {
        if (!webtoonRepository.existsById(webtoonId)) throw new BusinessException(ErrorCode.WEBTOON_NOT_FOUND);
        return reviewRepository.findByWebtoonIdAndDeletedFalseOrderByLikeCountDescCreatedAtDesc(webtoonId)
                .stream().map(r -> ReviewResponse.of(r, currentUserId,
                        currentUserId != null && reviewLikeRepository
                                .findByReviewIdAndUserId(r.getId(), currentUserId).isPresent()))
                .toList();
    }

    @Transactional
    public ActionResponse<ReviewResponse> create(Long webtoonId, Long userId, ReviewRequest request) {
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Webtoon webtoon = webtoonRepository.findById(webtoonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WEBTOON_NOT_FOUND));
        String content = ContentValidator.review(request.content());
        Review review = reviewRepository.findByUserIdAndWebtoonId(userId, webtoonId).orElse(null);
        if (review != null && !review.isDeleted()) throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS);
        if (review == null) {
            review = reviewRepository.saveAndFlush(Review.builder()
                    .webtoon(webtoon).user(user).rating(request.rating()).content(content).build());
        } else {
            review.restore(request.rating(), content);
        }
        ExpChangeResponse exp = experienceService.award(userId, LevelActionType.REVIEW, 5,
                "REVIEW", review.getId(), userId, reviewCreateEvent(userId, webtoonId));
        return new ActionResponse<>(ReviewResponse.of(review, userId, false), exp);
    }

    @Transactional
    public ActionResponse<ReviewResponse> update(Long reviewId, Long userId, ReviewRequest request) {
        Review review = getActiveForUpdate(reviewId);
        if (!review.isAuthor(userId)) throw new BusinessException(ErrorCode.ACCESS_DENIED);
        review.update(request.rating(), ContentValidator.review(request.content()));
        return new ActionResponse<>(ReviewResponse.of(review, userId,
                reviewLikeRepository.findByReviewIdAndUserId(reviewId, userId).isPresent()), null);
    }

    @Transactional
    public ActionResponse<Void> delete(Long reviewId, Long userId) {
        Review review = reviewRepository.findByIdForUpdate(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        if (!review.isAuthor(userId)) throw new BusinessException(ErrorCode.ACCESS_DENIED);
        if (review.isDeleted()) return new ActionResponse<>(null, null);
        review.softDelete();
        reviewLikeRepository.deleteAllByReviewId(reviewId);
        ExpChangeResponse exp = experienceService.reverseAllForReference("REVIEW", reviewId);
        return new ActionResponse<>(null, exp);
    }

    @Transactional
    public ActionResponse<ReviewLikeResponse> toggleLike(Long reviewId, Long userId) {
        Review review = getActiveForUpdate(reviewId);
        ReviewLike existing = reviewLikeRepository.findByReviewIdAndUserId(reviewId, userId).orElse(null);
        boolean liked;
        if (existing == null) {
            reviewLikeRepository.save(ReviewLike.builder().reviewId(reviewId).userId(userId).build());
            review.changeLikeCount(1);
            liked = true;
            if (!review.isAuthor(userId)) {
                experienceService.awardRecommendation(review.getUser().getId(), "REVIEW", reviewId, userId);
            }
        } else {
            reviewLikeRepository.delete(existing);
            review.changeLikeCount(-1);
            liked = false;
            if (!review.isAuthor(userId)) {
                experienceService.reverseRecommendation(review.getUser().getId(), "REVIEW", reviewId, userId);
            }
        }
        return new ActionResponse<>(new ReviewLikeResponse(review.getLikeCount(), liked), null);
    }

    private Review getActiveForUpdate(Long reviewId) {
        return reviewRepository.findByIdForUpdate(reviewId).filter(r -> !r.isDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
    }

    private String reviewCreateEvent(Long userId, Long webtoonId) {
        return "REVIEW_CREATE:" + userId + ":WEBTOON:" + webtoonId;
    }

}
