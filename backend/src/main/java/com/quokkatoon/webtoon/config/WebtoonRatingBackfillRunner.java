package com.quokkatoon.webtoon.config;

import com.quokkatoon.webtoon.service.WebtoonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** 기동 시 review → webtoon.rating_count / rating_avg 1회 동기화. */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebtoonRatingBackfillRunner implements ApplicationRunner {

    private final WebtoonService webtoonService;

    @Override
    public void run(ApplicationArguments args) {
        int updated = webtoonService.backfillRatingStats();
        log.info("Backfilled webtoon rating stats from reviews (rows touched≈{})", updated);
    }
}
