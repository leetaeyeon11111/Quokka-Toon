package com.quokkatoon.prompt.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuickPromptRequest(
        @NotBlank @Size(max = 50) String label,
        @NotBlank @Size(max = 200) String query,
        int sortOrder
) {}
