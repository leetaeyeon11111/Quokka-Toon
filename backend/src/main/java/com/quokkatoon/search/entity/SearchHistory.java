package com.quokkatoon.search.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "search_history")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SearchHistory extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 300)
    private String keyword;

    @Enumerated(EnumType.STRING)
    @Column(name = "search_mode", nullable = false,
            columnDefinition = "ENUM('NORMAL','AI')")
    private SearchMode searchMode = SearchMode.NORMAL;

    @Column(name = "searched_at", nullable = false)
    private LocalDateTime searchedAt;

    @Builder
    private SearchHistory(Long userId, String keyword, SearchMode searchMode) {
        this.userId = userId;
        this.keyword = keyword;
        this.searchMode = searchMode != null ? searchMode : SearchMode.NORMAL;
        this.searchedAt = LocalDateTime.now();
    }

    public void touch() {
        this.searchedAt = LocalDateTime.now();
    }
}
