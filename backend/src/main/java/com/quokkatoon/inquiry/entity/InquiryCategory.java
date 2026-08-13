package com.quokkatoon.inquiry.entity;

// 문의 분류 (실제 스키마: PAYMENT/BUG/SUGGEST/ACCOUNT/ETC)
public enum InquiryCategory {
    PAYMENT, BUG, SUGGEST, ACCOUNT, ETC;

    public static InquiryCategory from(String value) {
        return InquiryCategory.valueOf(value.trim().toUpperCase());
    }
}
