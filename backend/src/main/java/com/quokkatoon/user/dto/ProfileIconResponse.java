package com.quokkatoon.user.dto;

public record ProfileIconResponse(
        String id,
        String label,
        String group,
        String groupLabel,
        String imageUrl
) {}
