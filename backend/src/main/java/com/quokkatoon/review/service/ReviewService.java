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
import com.quokkatoon.user.entity.Gender;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import com.quokkatoon.webtoon.dto.DemographicsStats;
import com.quokkatoon.webtoon.entity.Webtoon;
import com.quokkatoon.webtoon.repository.WebtoonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final UserRepository userRepository;
    private final WebtoonRepository webtoonRepository;
    private final ExperienceService experienceService;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviews(Long webtoonId, Long currentUserId) {
        if (!webtoonRepository.existsById(webtoonId)) throw new BusinessException(ErrorCode.WEBTOON_NOT_FOUND);
        return reviewRepository.findByWebtoonIdAndDeletedFalseOrderByLikeCountDescCreatedAtDesc(webtoonId)
                .stream().map(r -> ReviewResponse.of(r, currentUserId,
                        currentUserId != null && reviewLikeRepository
                                .findByReviewIdAndUserId(r.getId(), currentUserId).isPresent()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MyReviewItem> getMyReviews(Long userId) {
        return reviewRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId).stream()
                .map(r -> new MyReviewItem(
                        r.getId(),
                        r.getWebtoon().getId(),
                        r.getWebtoon().getTitle(),
                        r.getWebtoon().getThumbnailUrl(),
                        r.getRating(),
                        r.getContent(),
                        r.getLikeCount(),
                        r.getCreatedAt(),
                        r.getUpdatedAt()))
                .toList();
    }

    /** 리뷰 작성자의 성별·생년월일로 집계. 표본 부족 시 null. */
    @Transactional(readOnly = true)
    public DemographicsStats getDemographics(Long webtoonId) {
        List<Review> reviews = reviewRepository.findActiveWithUserByWebtoonId(webtoonId);
        if (reviews.size() < 3) return null;

        List<Integer> maleRatings = new ArrayList<>();
        List<Integer> femaleRatings = new ArrayList<>();
        Map<String, List<Integer>> byAge = new LinkedHashMap<>();
        for (String band : List.of("10대", "20대", "30대", "40대", "50대 이상")) {
            byAge.put(band, new ArrayList<>());
        }

        LocalDate today = LocalDate.now();
        for (Review review : reviews) {
            User user = review.getUser();
            Gender gender = user.getGender();
            if (gender == Gender.M) maleRatings.add(review.getRating());
            else if (gender == Gender.F) femaleRatings.add(review.getRating());

            if (user.getBirthDate() != null) {
                int age = Period.between(user.getBirthDate(), today).getYears();
                String band = ageBand(age);
                if (band != null) byAge.get(band).add(review.getRating());
            }
        }

        int gendered = maleRatings.size() + femaleRatings.size();
        if (gendered < 3) return null;

        double maleRatio = round2(maleRatings.size() / (double) gendered);
        double femaleRatio = round2(1.0 - maleRatio);

        List<DemographicsStats.AgeRatingRow> ageRows = new ArrayList<>();
        for (Map.Entry<String, List<Integer>> e : byAge.entrySet()) {
            if (e.getValue().isEmpty()) continue;
            ageRows.add(new DemographicsStats.AgeRatingRow(
                    e.getKey(), avgOf(e.getValue()), e.getValue().size()));
        }

        // sampleSize = 성별이 설정된 리뷰 수(비율 분모). 미설정(NONE)은 제외.
        return new DemographicsStats(
                new DemographicsStats.GenderRatio(maleRatio, femaleRatio),
                new DemographicsStats.GenderRating(
                        maleRatings.isEmpty() ? null : avgOf(maleRatings),
                        femaleRatings.isEmpty() ? null : avgOf(femaleRatings)),
                ageRows,
                gendered);
    }

    private static String ageBand(int age) {
        if (age < 10) return null;
        if (age < 20) return "10대";
        if (age < 30) return "20대";
        if (age < 40) return "30대";
        if (age < 50) return "40대";
        return "50대 이상";
    }

    private static double avgOf(List<Integer> ratings) {
        double sum = 0;
        for (int r : ratings) sum += r;
        return round2(sum / ratings.size());
    }

    private static double round2(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
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
        refreshWebtoonRating(webtoonId);
        ExpChangeResponse exp = experienceService.award(userId, LevelActionType.REVIEW, 5,
                "REVIEW", review.getId(), userId, reviewCreateEvent(userId, webtoonId));
        return new ActionResponse<>(ReviewResponse.of(review, userId, false), exp);
    }

    @Transactional
    public ActionResponse<ReviewResponse> update(Long reviewId, Long userId, ReviewRequest request) {
        Review review = getActiveForUpdate(reviewId);
        if (!review.isAuthor(userId)) throw new BusinessException(ErrorCode.ACCESS_DENIED);
        review.update(request.rating(), ContentValidator.review(request.content()));
        refreshWebtoonRating(review.getWebtoon().getId());
        return new ActionResponse<>(ReviewResponse.of(review, userId,
                reviewLikeRepository.findByReviewIdAndUserId(reviewId, userId).isPresent()), null);
    }

    @Transactional
    public ActionResponse<Void> delete(Long reviewId, Long userId) {
        Review review = reviewRepository.findByIdForUpdate(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        if (!review.isAuthor(userId)) throw new BusinessException(ErrorCode.ACCESS_DENIED);
        if (review.isDeleted()) return new ActionResponse<>(null, null);
        Long webtoonId = review.getWebtoon().getId();
        review.softDelete();
        reviewLikeRepository.deleteAllByReviewId(reviewId);
        refreshWebtoonRating(webtoonId);
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

    private void refreshWebtoonRating(Long webtoonId) {
        Webtoon webtoon = webtoonRepository.findById(webtoonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WEBTOON_NOT_FOUND));
        long count = reviewRepository.countByWebtoonIdAndDeletedFalse(webtoonId);
        Double avg = reviewRepository.averageRatingByWebtoonId(webtoonId);
        BigDecimal ratingAvg = avg == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
        webtoon.applyRatingStats(ratingAvg, (int) count);
    }

    private String reviewCreateEvent(Long userId, Long webtoonId) {
        return "REVIEW_CREATE:" + userId + ":WEBTOON:" + webtoonId;
    }

}
