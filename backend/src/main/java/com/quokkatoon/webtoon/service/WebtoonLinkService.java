package com.quokkatoon.webtoon.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.webtoon.dto.ViewLinkResponse;
import com.quokkatoon.webtoon.entity.Webtoon;
import com.quokkatoon.webtoon.repository.WebtoonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * 웹툰 "바로 보기" 링크 조회 서비스.
 *
 * <p>로컬 DB 의 웹툰(제목 + 플랫폼)을 기준으로 클라우드 메타 API(korea-webtoon-api)를 호출해
 * 해당 플랫폼에서 실제 열람 가능한 딥링크를 가져온다. 지원 플랫폼은 네이버·카카오·카카오페이지
 * ·레진·리디·투믹스·탑툰 7종이며, 클라우드 조회에 실패하면 로컬 external_url 로 폴백한다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebtoonLinkService {

    private final WebtoonRepository webtoonRepository;
    private final RestClient webtoonApiClient;   // RestClientConfig 에서 주입

    @Transactional(readOnly = true)
    public ViewLinkResponse viewLink(Long webtoonId) {
        Webtoon w = webtoonRepository.findById(webtoonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WEBTOON_NOT_FOUND));

        String platformName = w.getPlatform() != null ? w.getPlatform().getName() : null;
        String title = w.getTitle();
        String localUrl = w.getExternalUrl();

        // 로컬 external_url 이 정확한 작품 딥링크면(= 검색 페이지가 아니면) 그대로 사용한다.
        // URL 에 "search" 가 들어가 있으면 플랫폼의 검색 결과 페이지일 뿐 정확한 링크가 아니므로,
        // 클라우드 API 실시간 조회로 더 정확한 링크를 확보하도록 넘어간다.
        if (hasLink(localUrl) && !isSearchUrl(localUrl)) {
            return ViewLinkResponse.local(localUrl, platformName);
        }

        CloudProvider provider = CloudProvider.fromPlatformName(platformName);
        if (provider == null) {
            // 지원하지 않는 플랫폼: 로컬 링크(검색 페이지라도)가 있으면 반환, 없으면 명시적 에러
            if (hasLink(localUrl)) {
                return ViewLinkResponse.local(localUrl, platformName);
            }
            throw new BusinessException(ErrorCode.UNSUPPORTED_PLATFORM);
        }

        String cloudUrl = fetchCloudUrl(provider, title);
        if (hasLink(cloudUrl)) {
            return ViewLinkResponse.cloud(cloudUrl, platformName);
        }

        // 클라우드 조회 실패/빈 결과 → 로컬 폴백
        if (hasLink(localUrl)) {
            log.info("[view-link] cloud miss, fallback to local. webtoonId={}, platform={}", webtoonId, platformName);
            return ViewLinkResponse.local(localUrl, platformName);
        }
        throw new BusinessException(ErrorCode.WEBTOON_LINK_UNAVAILABLE);
    }

    // 클라우드 API 호출. 실패 시 예외를 삼키고 null 을 반환해 상위에서 폴백하도록 한다.
    private String fetchCloudUrl(CloudProvider provider, String title) {
        try {
            if (provider.aboutStyle) {
                AboutResponse res = webtoonApiClient.get()
                        .uri(uri -> uri.path("/" + provider.code + "/about")
                                .queryParam("title", title)
                                .build())
                        .retrieve()
                        .body(AboutResponse.class);
                return res != null ? res.url() : null;
            }

            WebtoonsResponse res = webtoonApiClient.get()
                    .uri(uri -> uri.path("/webtoons")
                            .queryParam("keyword", title)
                            .queryParam("provider", provider.code)
                            .queryParam("perPage", 20)
                            .build())
                    .retrieve()
                    .body(WebtoonsResponse.class);
            return pickBestMatch(res, title);
        } catch (Exception e) {
            log.warn("[view-link] cloud api call failed. provider={}, title={}, err={}",
                    provider, title, e.getMessage());
            return null;
        }
    }

    // /webtoons 검색 결과에서 제목이 가장 잘 맞는 항목의 url 을 고른다.
    private static String pickBestMatch(WebtoonsResponse res, String title) {
        if (res == null || res.webtoons() == null || res.webtoons().isEmpty()) {
            return null;
        }
        String key = normalize(title);
        return res.webtoons().stream()
                .filter(item -> hasLink(item.url()))
                .filter(item -> normalize(item.title()).equals(key))
                .map(WebtoonItem::url)
                .findFirst()
                // 정확히 일치하는 제목이 없으면 링크가 있는 첫 항목 사용
                .orElseGet(() -> res.webtoons().stream()
                        .filter(item -> hasLink(item.url()))
                        .map(WebtoonItem::url)
                        .findFirst()
                        .orElse(null));
    }

    private static boolean hasLink(String url) {
        return url != null && url.startsWith("http");
    }

    // 플랫폼 검색 결과 페이지 URL 인지 판별 (정확한 작품 딥링크가 아님).
    // 예) https://www.lezhin.com/ko/search?q=..., https://toptoon.com/search?keyword=...
    private static boolean isSearchUrl(String url) {
        return url != null && url.toLowerCase().contains("search");
    }

    private static String normalize(String s) {
        return s == null ? "" : s.replaceAll("\\s+", "").toLowerCase();
    }

    /**
     * 로컬 플랫폼 이름 → 클라우드 API provider 매핑.
     * aboutStyle=true 는 {@code /{code}/about?title=} 엔드포인트를, false 는
     * {@code /webtoons?provider={code}} 엔드포인트를 사용한다.
     */
    private enum CloudProvider {
        NAVER("NAVER", false),
        KAKAO("KAKAO", false),
        KAKAO_PAGE("KAKAO_PAGE", false),
        LEZHIN("lezhin", true),
        RIDI("ridi", true),
        TOOMICS("toomics", true),
        TOPTOON("toptoon", true);

        final String code;
        final boolean aboutStyle;

        CloudProvider(String code, boolean aboutStyle) {
            this.code = code;
            this.aboutStyle = aboutStyle;
        }

        // 한글/영어 표기를 모두 인식한다. "카카오페이지"는 "카카오"보다 먼저 검사해야 한다.
        static CloudProvider fromPlatformName(String name) {
            if (name == null) return null;
            String n = name.replaceAll("\\s+", "").toLowerCase();
            if (n.contains("카카오페이지") || n.contains("kakaopage") || n.contains("kakao_page")) return KAKAO_PAGE;
            if (n.contains("카카오") || n.contains("kakao")) return KAKAO;
            if (n.contains("네이버") || n.contains("naver")) return NAVER;
            if (n.contains("레진") || n.contains("lezhin")) return LEZHIN;
            if (n.contains("리디") || n.contains("ridi")) return RIDI;
            if (n.contains("투믹스") || n.contains("toomics")) return TOOMICS;
            if (n.contains("탑툰") || n.contains("toptoon")) return TOPTOON;
            return null;
        }
    }

    // ===== 클라우드 API 응답 매핑용 DTO (필요한 필드만) =====

    // GET /{lezhin|ridi|toomics|toptoon}/about
    private record AboutResponse(String url) {}

    // GET /webtoons
    private record WebtoonsResponse(List<WebtoonItem> webtoons) {}

    private record WebtoonItem(String title, String url, String provider) {}
}
