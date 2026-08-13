package com.quokkatoon.inquiry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InquiryCreateRequest(
        @NotBlank String category,   // PAYMENT | ERROR | SUGGESTION | ACCOUNT | ETC
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content
) {}
