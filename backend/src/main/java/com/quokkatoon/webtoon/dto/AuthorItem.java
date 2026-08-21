package com.quokkatoon.webtoon.dto;

// 웹툰 작가 1명 (이름 + 역할: WRITER/ARTIST/ORIGINAL)
public record AuthorItem(
        String name,
        String role
) {}
