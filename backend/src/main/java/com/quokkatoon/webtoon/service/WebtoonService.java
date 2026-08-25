package com.quokkatoon.webtoon.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.webtoon.dto.AuthorItem;
import com.quokkatoon.webtoon.dto.MediaMixItem;
import com.quokkatoon.webtoon.dto.MediaMixWatchLink;
import com.quokkatoon.webtoon.dto.PlatformLinkItem;
import com.quokkatoon.webtoon.dto.WebtoonDetailResponse;
import com.quokkatoon.webtoon.dto.WebtoonListItem;
import com.quokkatoon.webtoon.entity.Webtoon;
import com.quokkatoon.webtoon.repository.WebtoonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WebtoonService {

    private final WebtoonRepository webtoonRepository;

    // 목록: 제목/플랫폼/장르/작가/태그 필터 (빈 문자열은 null 로 처리해 필터 해제).
    @Transactional(readOnly = true)
    public Page<WebtoonListItem> search(String q, String platform, String genre,
                                        String author, String tag, Pageable pageable) {
        return webtoonRepository
                .search(blankToNull(q), blankToNull(platform), blankToNull(genre),
                        blankToNull(author), blankToNull(tag), pageable)
                .map(WebtoonListItem::from);
    }

    // 상세: 기본정보 + 연결 테이블(작가/장르/태그/플랫폼 바로가기) 조인
    // 조회 시 view_count 증가 (조회순 정렬용)
    @Transactional
    public WebtoonDetailResponse detail(Long id) {
        Webtoon w = webtoonRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.WEBTOON_NOT_FOUND));
        w.incrementViewCount();

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

        return WebtoonDetailResponse.from(w, authors, genres, tags, platforms, mediaMix);
    }

    @Transactional(readOnly = true)
    public List<WebtoonListItem> ranking(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 30));
        return webtoonRepository.findRanking(safeLimit).stream()
                .map(WebtoonListItem::from)
                .toList();
    }

    @Transactional
    public int backfillRatingStats() {
        return webtoonRepository.backfillRatingStatsFromReviews();
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
}
