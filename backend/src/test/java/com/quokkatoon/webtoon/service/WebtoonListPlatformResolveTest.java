package com.quokkatoon.webtoon.service;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WebtoonListPlatformResolveTest {

    @Test
    void pageOnlyShowsKakaoPage() {
        assertEquals(
                "카카오페이지",
                WebtoonService.resolveListPlatformName("카카오페이지", Set.of("카카오페이지"), null));
    }

    @Test
    void dualPrefersKakaoWebtoonByDefault() {
        assertEquals(
                "카카오웹툰",
                WebtoonService.resolveListPlatformName(
                        "카카오페이지", Set.of("카카오페이지", "카카오웹툰"), null));
        assertEquals(
                "카카오웹툰",
                WebtoonService.resolveListPlatformName(
                        "카카오웹툰", Set.of("카카오페이지", "카카오웹툰"), null));
    }

    @Test
    void filterOverridesBadge() {
        assertEquals(
                "카카오페이지",
                WebtoonService.resolveListPlatformName(
                        "카카오웹툰", Set.of("카카오페이지", "카카오웹툰"), "카카오페이지"));
        assertEquals(
                "카카오웹툰",
                WebtoonService.resolveListPlatformName(
                        "카카오페이지", Set.of("카카오페이지", "카카오웹툰"), "카카오웹툰"));
    }

    @Test
    void nonKakaoKeepsPrimary() {
        assertEquals(
                "네이버웹툰",
                WebtoonService.resolveListPlatformName("네이버웹툰", Set.of("네이버웹툰"), null));
    }
}
