package com.quokkatoon.recommend.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.recommend.dto.RecommendRequest;
import com.quokkatoon.recommend.dto.RecommendResponse;
import com.quokkatoon.search.entity.SearchMode;
import com.quokkatoon.search.service.SearchHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
public class RecommendService {

    private final RestClient recommendClient;   // RestClientConfig 에서 주입
    private final SearchHistoryService searchHistoryService;

    public RecommendResponse recommend(RecommendRequest req) {
        try {
            RecommendResponse res = recommendClient.post()
                    .uri("/recommend")
                    .body(req)
                    .retrieve()
                    .body(RecommendResponse.class);

            // 로그인 사용자의 AI 검색만 모드별로 기록한다.
            if (req.userId() != null && req.query() != null && !req.query().isBlank()) {
                searchHistoryService.record(req.userId(), req.query().trim(), SearchMode.AI);
            }
            return res;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.RECOMMEND_SERVER_ERROR);
        }
    }
}
