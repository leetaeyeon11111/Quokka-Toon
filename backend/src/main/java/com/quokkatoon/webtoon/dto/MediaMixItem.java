package com.quokkatoon.webtoon.dto;

import java.util.List;

/** 웹툰 원작의 영화·드라마·애니 등 미디어믹스 1건. */
public record MediaMixItem(
        String mediaType,
        String mediaTitle,
        Integer season,
        Integer year,
        String platform,
        String status,
        String namuWikiUrl,
        List<MediaMixWatchLink> watchLinks
) {}
