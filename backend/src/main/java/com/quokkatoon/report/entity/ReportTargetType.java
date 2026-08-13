package com.quokkatoon.report.entity;

public enum ReportTargetType {
    POST, COMMENT, REVIEW;

    public static ReportTargetType from(String value) {
        return ReportTargetType.valueOf(value.trim().toUpperCase());
    }
}
