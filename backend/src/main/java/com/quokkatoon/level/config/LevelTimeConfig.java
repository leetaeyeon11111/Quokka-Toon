package com.quokkatoon.level.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class LevelTimeConfig {
    public static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Bean
    public Clock levelClock() {
        return Clock.system(KST);
    }
}
