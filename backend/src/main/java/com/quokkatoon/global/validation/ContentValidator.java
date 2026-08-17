package com.quokkatoon.global.validation;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;

public final class ContentValidator {
    private ContentValidator() {}

    public static String postTitle(String value) {
        return trimmed(value, 2, 200, ErrorCode.INVALID_POST_TITLE);
    }

    public static String postContent(String value) {
        return trimmed(value, 20, 10_000, ErrorCode.INVALID_POST_CONTENT);
    }

    public static String comment(String value) {
        return trimmed(value, 5, 1_000, ErrorCode.INVALID_COMMENT_CONTENT);
    }

    public static String review(String value) {
        return trimmed(value, 20, 2_000, ErrorCode.INVALID_REVIEW_CONTENT);
    }

    private static String trimmed(String value, int min, int max, ErrorCode errorCode) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.length() < min || normalized.length() > max) {
            throw new BusinessException(errorCode);
        }
        return normalized;
    }
}
