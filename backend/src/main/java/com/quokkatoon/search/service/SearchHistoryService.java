package com.quokkatoon.search.service;

import com.quokkatoon.search.dto.SearchHistoryDtos.ItemResponse;
import com.quokkatoon.search.entity.SearchHistory;
import com.quokkatoon.search.entity.SearchMode;
import com.quokkatoon.search.repository.SearchHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchHistoryService {

    private static final int RECENT_LIMIT = 8;

    private final SearchHistoryRepository repository;

    /** 같은 모드·같은 키워드는 시각만 갱신해 최근 목록을 유지한다. */
    @Transactional
    public ItemResponse record(Long userId, String keyword, SearchMode mode) {
        String trimmed = keyword == null ? "" : keyword.trim();
        if (userId == null || trimmed.isEmpty()) {
            return null;
        }
        SearchMode resolved = mode != null ? mode : SearchMode.NORMAL;
        SearchHistory history = repository
                .findFirstByUserIdAndSearchModeAndKeyword(userId, resolved, trimmed)
                .orElseGet(() -> SearchHistory.builder()
                        .userId(userId)
                        .keyword(trimmed)
                        .searchMode(resolved)
                        .build());
        history.touch();
        return ItemResponse.from(repository.save(history));
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> recent(Long userId, SearchMode mode) {
        List<SearchHistory> rows = repository
                .findTop20ByUserIdAndSearchModeOrderBySearchedAtDesc(userId, mode);
        // 동일 키워드가 중복으로 남아 있어도 최근 순으로 한 번만 노출
        LinkedHashSet<String> seen = new LinkedHashSet<>();
        return rows.stream()
                .filter(row -> seen.add(row.getKeyword()))
                .limit(RECENT_LIMIT)
                .map(ItemResponse::from)
                .toList();
    }

    @Transactional
    public void deleteOne(Long userId, SearchMode mode, String keyword) {
        if (keyword == null || keyword.isBlank()) return;
        repository.deleteByUserIdAndSearchModeAndKeyword(userId, mode, keyword.trim());
    }

    @Transactional
    public void clear(Long userId, SearchMode mode) {
        repository.deleteByUserIdAndSearchMode(userId, mode);
    }
}
