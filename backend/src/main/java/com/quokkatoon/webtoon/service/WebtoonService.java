package com.quokkatoon.webtoon.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.review.service.ReviewService;
import com.quokkatoon.webtoon.dto.AuthorItem;
import com.quokkatoon.webtoon.dto.DemographicsStats;
import com.quokkatoon.webtoon.dto.MediaMixItem;
import com.quokkatoon.webtoon.dto.MediaMixWatchLink;
import com.quokkatoon.webtoon.dto.PlatformLinkItem;
import com.quokkatoon.webtoon.dto.WebtoonDetailResponse;
import com.quokkatoon.webtoon.dto.WebtoonListItem;
import com.quokkatoon.webtoon.entity.Webtoon;
import com.quokkatoon.webtoon.repository.WebtoonRepository;
import com.quokkatoon.webtoon.repository.WebtoonViewEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class WebtoonService {

    private static final String KAKAO_WEBTOON = "카카오웹툰";
    private static final String KAKAO_PAGE = "카카오페이지";
    private static final ZoneId RANKING_ZONE = ZoneId.of("Asia/Seoul");
    private static final long RANKING_CACHE_MILLIS = 10 * 60 * 1000L;

    private final WebtoonRepository webtoonRepository;
    private final WebtoonViewEventRepository webtoonViewEventRepository;
    private final ReviewService reviewService;
    private final Object rankingCacheLock = new Object();
    private volatile RankingCache rankingCache;

    // 목록: 제목/플랫폼/장르/작가/태그 필터 (빈 문자열은 null 로 처리해 필터 해제).
    @Transactional(readOnly = true)
    public Page<WebtoonListItem> search(String q, String platform, String genre,
                                        String author, String tag, String sort, Pageable pageable) {
        String platformFilter = blankToNull(platform);
        Page<Webtoon> page = webtoonRepository
                .search(blankToNull(q), platformFilter, blankToNull(genre),
                        blankToNull(author), blankToNull(tag), normalizeSort(sort), pageable);
        Map<Long, Set<String>> namesById = platformNamesByWebtoon(page.getContent());
        Map<String, String> logoByName = platformLogos(List.of(KAKAO_WEBTOON, KAKAO_PAGE));
        return page.map(w -> toListItem(w, platformFilter, namesById, logoByName));
    }

    // 상세: 기본정보 + 연결 테이블(작가/장르/태그/플랫폼 바로가기) 조인
    // 조회수는 별도 recordView 로만 증가 (GET 중복·추천/즐겨찾기용 상세 조회와 분리)
    @Transactional(readOnly = true)
    public WebtoonDetailResponse detail(Long id) {
        Webtoon w = webtoonRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.WEBTOON_NOT_FOUND));

        List<AuthorItem> authors = webtoonRepository.findAuthors(id).stream()
                .map(row -> new AuthorItem((String) row[0], (String) row[1]))
                .toList();
        List<String> genres = webtoonRepository.findGenreNames(id);
        List<String> tags = webtoonRepository.findTagNames(id);

        List<PlatformLinkItem> platforms = webtoonRepository.findPlatformLinks(id).stream()
                .map(row -> new PlatformLinkItem(
                        (String) row[0],
                        (String) row[1],
                        (String) row[2],
                        toPrimaryFlag(row[3])))
                .toList();

        if (platforms.isEmpty() && w.getExternalUrl() != null && !w.getExternalUrl().isBlank()
                && !w.getExternalUrl().toLowerCase().contains("google.")) {
            String platName = w.getPlatform() != null ? w.getPlatform().getName() : "바로가기";
            String logoUrl = w.getPlatform() != null ? w.getPlatform().getLogoUrl() : null;
            platforms = List.of(new PlatformLinkItem(platName, w.getExternalUrl(), logoUrl, true));
        }

        List<MediaMixItem> mediaMix = loadMediaMix(id);
        DemographicsStats demographics = reviewService.getDemographics(id);

        return WebtoonDetailResponse.from(w, authors, genres, tags, platforms, mediaMix, demographics);
    }

    /** 동일 사용자·작품의 조회는 한국 날짜 기준 하루 1회만 집계한다. */
    @Transactional
    public long recordView(Long id, Long userId, String visitorId) {
        if (!webtoonRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.WEBTOON_NOT_FOUND);
        }

        LocalDateTime viewedAt = LocalDateTime.now(RANKING_ZONE);
        int inserted = webtoonViewEventRepository.insertIfAbsent(
                id,
                WebtoonViewerKey.from(userId, visitorId),
                viewedAt.toLocalDate(),
                viewedAt);

        if (inserted > 0) {
            webtoonRepository.incrementViewCountById(id);
        }
        return webtoonRepository.findViewCountById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.WEBTOON_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<WebtoonListItem> ranking(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 30));
        List<WebtoonListItem> snapshot = hotRankingSnapshot();
        return List.copyOf(snapshot.subList(0, Math.min(safeLimit, snapshot.size())));
    }

    private List<WebtoonListItem> hotRankingSnapshot() {
        long now = System.currentTimeMillis();
        RankingCache cached = rankingCache;
        if (cached != null && cached.expiresAtMillis() > now) return cached.items();

        synchronized (rankingCacheLock) {
            cached = rankingCache;
            if (cached != null && cached.expiresAtMillis() > now) return cached.items();

            List<Webtoon> rows = webtoonRepository.findHotRanking(30);
            Map<Long, Set<String>> namesById = platformNamesByWebtoon(rows);
            Map<String, String> logoByName = platformLogos(List.of(KAKAO_WEBTOON, KAKAO_PAGE));
            List<WebtoonListItem> items = rows.stream()
                    .map(w -> toListItem(w, null, namesById, logoByName))
                    .toList();
            rankingCache = new RankingCache(items, now + RANKING_CACHE_MILLIS);
            return items;
        }
    }

    private record RankingCache(List<WebtoonListItem> items, long expiresAtMillis) {
    }

    @Transactional
    public int backfillRatingStats() {
        return webtoonRepository.backfillRatingStatsFromReviews();
    }

    /**
     * 목록 썸네일 배지용 플랫폼명.
     * - 플랫폼 필터 중이면 필터 플랫폼명
     * - 카카오웹툰+페이지 동시 보유(또는 카카오 계열)면 기본은 카카오웹툰 우선
     * - 카카오페이지 단독이면 카카오페이지
     */
    static String resolveListPlatformName(String primary, Set<String> linked, String platformFilter) {
        if (platformFilter != null && !platformFilter.isBlank()) {
            return platformFilter;
        }
        Set<String> names = linked != null ? linked : Set.of();
        boolean hasWeb = names.contains(KAKAO_WEBTOON) || KAKAO_WEBTOON.equals(primary);
        boolean hasPage = names.contains(KAKAO_PAGE) || KAKAO_PAGE.equals(primary);
        boolean kakaoRelated = hasWeb || hasPage
                || KAKAO_WEBTOON.equals(primary) || KAKAO_PAGE.equals(primary);
        if (kakaoRelated) {
            if (hasWeb) return KAKAO_WEBTOON;
            if (hasPage) return KAKAO_PAGE;
        }
        return primary;
    }

    private WebtoonListItem toListItem(Webtoon w, String platformFilter,
                                       Map<Long, Set<String>> namesById,
                                       Map<String, String> logoByName) {
        String primary = w.getPlatform() != null ? w.getPlatform().getName() : null;
        String primaryLogo = w.getPlatform() != null ? w.getPlatform().getLogoUrl() : null;
        Set<String> linked = namesById.getOrDefault(w.getId(), Set.of());
        String display = resolveListPlatformName(primary, linked, platformFilter);
        String logo = display != null ? logoByName.getOrDefault(display, primaryLogo) : primaryLogo;
        if (logo == null) logo = primaryLogo;
        return WebtoonListItem.from(w, display, logo);
    }

    private Map<Long, Set<String>> platformNamesByWebtoon(List<Webtoon> webtoons) {
        Map<Long, Set<String>> map = new HashMap<>();
        if (webtoons == null || webtoons.isEmpty()) return map;
        List<Long> ids = webtoons.stream().map(Webtoon::getId).toList();
        for (Object[] row : webtoonRepository.findPlatformNamesForWebtoons(ids)) {
            Long id = toLong(row[0]);
            String name = row[1] != null ? String.valueOf(row[1]) : null;
            if (id == null || name == null || name.isBlank()) continue;
            map.computeIfAbsent(id, k -> new HashSet<>()).add(name);
        }
        return map;
    }

    private Map<String, String> platformLogos(List<String> names) {
        Map<String, String> map = new HashMap<>();
        if (names == null || names.isEmpty()) return map;
        for (Object[] row : webtoonRepository.findPlatformLogosByNames(names)) {
            if (row[0] == null) continue;
            String name = String.valueOf(row[0]);
            String logo = row[1] != null ? String.valueOf(row[1]) : null;
            map.put(name, logo);
        }
        return map;
    }

    private List<MediaMixItem> loadMediaMix(Long webtoonId) {
        List<Object[]> rows = webtoonRepository.findMediaMix(webtoonId);
        if (rows.isEmpty()) return List.of();

        Map<Long, List<MediaMixWatchLink>> linksByMix = new LinkedHashMap<>();
        for (Object[] link : webtoonRepository.findMediaMixLinks(webtoonId)) {
            Long mixId = toLong(link[0]);
            String url = (String) link[1];
            if (mixId == null || url == null || url.isBlank()) continue;
            String label = link[2] != null ? String.valueOf(link[2]) : "보기";
            linksByMix.computeIfAbsent(mixId, k -> new ArrayList<>())
                    .add(new MediaMixWatchLink(url, label));
        }

        List<MediaMixItem> items = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Long mixId = toLong(row[0]);
            List<MediaMixWatchLink> links = linksByMix.getOrDefault(mixId, List.of());
            if (links.isEmpty()) {
                String fallback = (String) row[8];
                if (fallback != null && !fallback.isBlank()) {
                    links = List.of(new MediaMixWatchLink(fallback, "보기"));
                }
            }
            items.add(new MediaMixItem(
                    (String) row[1],
                    (String) row[2],
                    toInteger(row[3]),
                    toInteger(row[4]),
                    (String) row[5],
                    row[6] != null ? String.valueOf(row[6]) : "released",
                    (String) row[7],
                    links
            ));
        }
        return items;
    }

    private static Long toLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        return null;
    }

    private static Integer toInteger(Object value) {
        if (value instanceof Number n) return n.intValue();
        return null;
    }

    private static boolean toPrimaryFlag(Object value) {
        if (value instanceof Boolean b) return b;
        if (value instanceof Number n) return n.intValue() != 0;
        return false;
    }

    @Transactional(readOnly = true)
    public List<String> genreNames() {
        return webtoonRepository.findAllGenreNames();
    }

    @Transactional(readOnly = true)
    public List<String> platformNames() {
        return webtoonRepository.findAllPlatformNames();
    }

    @Transactional(readOnly = true)
    public List<String> popularTagNames(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 40));
        return webtoonRepository.findPopularTagNames(safeLimit);
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private static String normalizeSort(String sort) {
        if (sort == null) return "latest";
        return switch (sort.trim()) {
            case "views", "bookmark", "rating" -> sort.trim();
            default -> "latest";
        };
    }
}
