package com.quokkatoon.webtoon.entity;
public enum AgeRating { ALL, C12, C15, C19;
    // DB ENUM 값('ALL','12','15','19')과 매핑하기 위한 변환
    public String toDbValue() {
        return switch (this) { case ALL -> "ALL"; case C12 -> "12"; case C15 -> "15"; case C19 -> "19"; };
    }
}
