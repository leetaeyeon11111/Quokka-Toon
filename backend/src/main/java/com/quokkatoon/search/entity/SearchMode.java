package com.quokkatoon.search.entity;

public enum SearchMode {
    NORMAL, AI;

    public static SearchMode from(String value) {
        if (value == null || value.isBlank()) {
            return NORMAL;
        }
        return SearchMode.valueOf(value.trim().toUpperCase());
    }
}
