package com.quokkatoon.recommend.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.recommend.dto.RecommendRequest;
import com.quokkatoon.recommend.dto.RecommendResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
public class RecommendService {

    private final RestClient recommendClient;   // RestClientConfig 에서 주입

    public RecommendResponse recommend(RecommendRequest req) {
        try {
            RecommendResponse res = recommendClient.post()
                    .uri("/recommend")
                    .body(req)
                    .retrieve()
                    .body(RecommendResponse.class);

            // TODO: 여기서 ai_recommendation / search_history 저장 (엔티티 추가 후)
            return res;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.RECOMMEND_SERVER_ERROR);
        }
    }
}
