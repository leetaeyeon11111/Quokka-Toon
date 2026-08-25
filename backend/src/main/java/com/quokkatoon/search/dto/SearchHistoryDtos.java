package com.quokkatoon.search.dto;

import com.quokkatoon.search.entity.SearchHistory;
import com.quokkatoon.search.entity.SearchMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class SearchHistoryDtos {

    private SearchHistoryDtos() {}

    public record CreateRequest(
            @NotBlank @Size(max = 300) String keyword,
            String mode   // NORMAL | AI
    ) {}

    public record ItemResponse(
            Long id,
            String keyword,
            String mode,
            LocalDateTime searchedAt
    ) {
        public static ItemResponse from(SearchHistory h) {
            return new ItemResponse(
                    h.getId(),
                    h.getKeyword(),
                    h.getSearchMode().name(),
                    h.getSearchedAt()
            );
        }
    }

    public static SearchMode parseMode(String mode) {
        return SearchMode.from(mode);
    }
}
