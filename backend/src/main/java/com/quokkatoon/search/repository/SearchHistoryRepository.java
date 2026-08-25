package com.quokkatoon.search.repository;

import com.quokkatoon.search.entity.SearchHistory;
import com.quokkatoon.search.entity.SearchMode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {

    List<SearchHistory> findTop20ByUserIdAndSearchModeOrderBySearchedAtDesc(
            Long userId, SearchMode searchMode);

    Optional<SearchHistory> findFirstByUserIdAndSearchModeAndKeyword(
            Long userId, SearchMode searchMode, String keyword);

    void deleteByUserIdAndSearchModeAndKeyword(Long userId, SearchMode searchMode, String keyword);

    void deleteByUserIdAndSearchMode(Long userId, SearchMode searchMode);
}
