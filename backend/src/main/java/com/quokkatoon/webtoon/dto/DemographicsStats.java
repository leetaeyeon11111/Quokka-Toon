package com.quokkatoon.webtoon.dto;

import java.util.List;

/**
 * 리뷰 작성자 성별·연령 기반 통계 (목업 아님). 표본이 부족하면 null.
 * genderRatio.male/female 는 0~1 비율(예: 0.63 = 63%).
 * sampleSize 는 성별(M/F)이 있는 리뷰 수.
 */
public record DemographicsStats(
        GenderRatio genderRatio,
        GenderRating genderRating,
        List<AgeRatingRow> ageRatings,
        int sampleSize
) {
    public record GenderRatio(double male, double female) {}
    public record GenderRating(Double male, Double female) {}
    public record AgeRatingRow(String age, double avg, int count) {}
}
