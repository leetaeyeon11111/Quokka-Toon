package com.quokkatoon.report.entity;

// 신고 유형 (실제 스키마: SPAM/ABUSE/OBSCENE/FLOOD/COPYRIGHT)
public enum ReportType {
    SPAM, ABUSE, OBSCENE, FLOOD, COPYRIGHT;

    public static ReportType from(String value) {
        return ReportType.valueOf(value.trim().toUpperCase());
    }
}
