package com.quokkatoon.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    // FastAPI 추천 서버 전용 클라이언트
    @Bean
    public RestClient recommendClient(@Value("${recommend.base-url}") String baseUrl) {
        // Uvicorn은 JDK HttpClient의 h2c 업그레이드 요청을 지원하지 않으므로
        // 단순 HTTP/1.1 요청 팩토리를 명시한다.
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }
}
