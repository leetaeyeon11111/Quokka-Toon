package com.quokkatoon.recommend.dto;

import java.util.List;

public record RecommendResponse(
        String query,
        List<RecommendItem> results
) {}
