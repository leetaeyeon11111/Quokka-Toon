package com.quokkatoon.prompt.dto;

import com.quokkatoon.prompt.entity.QuickPrompt;

public record QuickPromptResponse(
        Long id,
        String label,
        String query,
        int sortOrder
) {
    public static QuickPromptResponse from(QuickPrompt p) {
        return new QuickPromptResponse(p.getId(), p.getLabel(), p.getQuery(), p.getSortOrder());
    }
}
