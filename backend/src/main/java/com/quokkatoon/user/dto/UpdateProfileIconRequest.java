package com.quokkatoon.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileIconRequest(
        @NotBlank String iconId
) {}
