package com.quokkatoon.global.validation;

import com.quokkatoon.global.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ContentValidatorTest {
    @Test
    void validatesTrimmedPostCommentAndReviewLengths() {
        assertThat(ContentValidator.postTitle("  제목  ")).isEqualTo("제목");
        assertThatThrownBy(() -> ContentValidator.postTitle(" a ")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> ContentValidator.postContent("   ")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> ContentValidator.comment(" 1234 ")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> ContentValidator.review("short review"))
                .isInstanceOf(BusinessException.class);
        assertThat(ContentValidator.comment(" 12345 ")).isEqualTo("12345");
    }

    @Test
    void acceptsTrimmedBoundariesAndRejectsOneCharacterBeyondEachMaximum() {
        assertThat(ContentValidator.postTitle("  " + "a".repeat(200) + "  ")).hasSize(200);
        assertThat(ContentValidator.postContent("  " + "a".repeat(20) + "  ")).hasSize(20);
        assertThat(ContentValidator.comment("  " + "a".repeat(1_000) + "  ")).hasSize(1_000);
        assertThat(ContentValidator.review("  " + "a".repeat(2_000) + "  ")).hasSize(2_000);

        assertThatThrownBy(() -> ContentValidator.postTitle("a".repeat(201)))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> ContentValidator.postContent("a".repeat(10_001)))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> ContentValidator.comment("a".repeat(1_001)))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> ContentValidator.review("a".repeat(2_001)))
                .isInstanceOf(BusinessException.class);
    }
}
