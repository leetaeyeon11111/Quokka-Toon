package com.quokkatoon.global.common;

public record ApiResponse<T>(boolean success, T data, String message, String code) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, null, message, null);
    }

    public static <T> ApiResponse<T> fail(String message, String code, T data) {
        return new ApiResponse<>(false, data, message, code);
    }
}
