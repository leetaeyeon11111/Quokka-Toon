package com.quokkatoon.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReportCreateRequest(
        @NotBlank String targetType,   // POST | COMMENT | REVIEW
        @NotNull Long targetId,
        @NotBlank String type          // SPAM | ABUSE | OBSCENE | FLOOD | COPYRIGHT
) {}
