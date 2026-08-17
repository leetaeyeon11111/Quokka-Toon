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
}
