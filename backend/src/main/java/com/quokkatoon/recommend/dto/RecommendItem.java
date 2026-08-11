package com.quokkatoon.recommend.dto;

// FastAPI 가 돌려주는 작품별 추천 결과 (ai_recommendation 컬럼과 대응)
public record RecommendItem(
        Long webtoonId,
        String reasonText,
        int scoreQuery,
        int scoreTaste,
        int scoreTotal,
        Object radar          // {"axes":[...], "values":[...]} JSON
) {}
