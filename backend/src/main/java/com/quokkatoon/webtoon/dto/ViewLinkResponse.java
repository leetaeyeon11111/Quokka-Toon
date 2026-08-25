package com.quokkatoon.webtoon.dto;

/**
 * 웹툰 "바로 보기" 링크 응답.
 *
 * @param url      플랫폼에서 실제로 열람 가능한 링크
 * @param platform 대상 플랫폼 이름(로컬 DB 기준)
 * @param source   링크 출처. CLOUD_API = korea-webtoon-api 실시간 조회, LOCAL = 로컬 DB의 external_url 폴백
 */
public record ViewLinkResponse(
        String url,
        String platform,
        String source
) {
    public static ViewLinkResponse cloud(String url, String platform) {
        return new ViewLinkResponse(url, platform, "CLOUD_API");
    }

    public static ViewLinkResponse local(String url, String platform) {
        return new ViewLinkResponse(url, platform, "LOCAL");
    }
}
