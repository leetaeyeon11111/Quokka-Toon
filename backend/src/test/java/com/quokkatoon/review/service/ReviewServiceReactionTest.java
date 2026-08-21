package com.quokkatoon.review.service;

import com.quokkatoon.level.service.ExperienceService;
import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.review.dto.ReviewRequest;
import com.quokkatoon.review.entity.Review;
import com.quokkatoon.review.repository.ReviewLikeRepository;
import com.quokkatoon.review.repository.ReviewRepository;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import com.quokkatoon.webtoon.repository.WebtoonRepository;
import com.quokkatoon.webtoon.entity.Webtoon;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class ReviewServiceReactionTest {
    @Test
    void selfReviewRecommendationNeverAwardsExperience() {
        ReviewRepository reviews = mock(ReviewRepository.class);
        ReviewLikeRepository likes = mock(ReviewLikeRepository.class);
        ExperienceService experience = mock(ExperienceService.class);
        User author = User.builder().email("author@test.com").passwordHash("x").nickname("author").build();
        ReflectionTestUtils.setField(author, "id", 1L);
        Review review = Review.builder().user(author).rating(5).content("a sufficiently long review content").build();
        ReflectionTestUtils.setField(review, "id", 9L);
        when(reviews.findByIdForUpdate(9L)).thenReturn(Optional.of(review));
        when(likes.findByReviewIdAndUserId(9L, 1L)).thenReturn(Optional.empty());
        ReviewService service = new ReviewService(reviews, likes, mock(UserRepository.class),
                mock(WebtoonRepository.class), experience);

        var result = service.toggleLike(9L, 1L).result();

        assertThat(result.liked()).isTrue();
        assertThat(result.likes()).isEqualTo(1);
        verifyNoInteractions(experience);
    }

    @Test
    void reviewCreationIsOncePerWebtoonAndUpdateDoesNotAwardAgain() {
        ReviewRepository reviews = mock(ReviewRepository.class);
        ReviewLikeRepository likes = mock(ReviewLikeRepository.class);
        UserRepository users = mock(UserRepository.class);
        WebtoonRepository webtoons = mock(WebtoonRepository.class);
        ExperienceService experience = mock(ExperienceService.class);
        User author = User.builder().email("writer@test.com").passwordHash("x").nickname("writer").build();
        ReflectionTestUtils.setField(author, "id", 3L);
        Webtoon webtoon = mock(Webtoon.class);
        when(users.findByIdForUpdate(3L)).thenReturn(Optional.of(author));
        when(webtoons.findById(7L)).thenReturn(Optional.of(webtoon));
        when(reviews.findByUserIdAndWebtoonId(3L, 7L)).thenReturn(Optional.empty());
        Review created = Review.builder().webtoon(webtoon).user(author)
                .rating(5).content("This is a sufficiently long formal review.").build();
        ReflectionTestUtils.setField(created, "id", 30L);
        when(reviews.saveAndFlush(any(Review.class))).thenReturn(created);
        ReviewService service = new ReviewService(reviews, likes, users, webtoons, experience);
        ReviewRequest request = new ReviewRequest(5, "This is a sufficiently long formal review.");

        assertThat(service.create(7L, 3L, request).result().id()).isEqualTo(30L);
        verify(experience, times(1)).award(eq(3L), any(), eq(5), eq("REVIEW"), eq(30L), eq(3L),
                eq("REVIEW_CREATE:3:WEBTOON:7"));

        when(reviews.findByUserIdAndWebtoonId(3L, 7L)).thenReturn(Optional.of(created));
        assertThatThrownBy(() -> service.create(7L, 3L, request)).isInstanceOf(BusinessException.class);

        when(reviews.findByIdForUpdate(30L)).thenReturn(Optional.of(created));
        service.update(30L, 3L, new ReviewRequest(4, "This updated review is still long enough."));
        verify(experience, times(1)).award(anyLong(), any(), anyInt(), any(), anyLong(), anyLong(), any());
    }
}
