package com.quokkatoon.webtoon.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

final class WebtoonViewerKey {

    private static final int MAX_VISITOR_ID_LENGTH = 80;

    private WebtoonViewerKey() {
    }

    static String from(Long userId, String visitorId) {
        String raw;
        if (userId != null) {
            raw = "user:" + userId;
        } else {
            String normalized = normalizeVisitorId(visitorId);
            raw = "visitor:" + normalized;
        }
        return sha256(raw);
    }

    private static String normalizeVisitorId(String visitorId) {
        if (visitorId == null) return "anonymous";
        String trimmed = visitorId.trim();
        if (trimmed.length() < 8 || trimmed.length() > MAX_VISITOR_ID_LENGTH) return "anonymous";
        if (!trimmed.matches("[A-Za-z0-9_-]+")) return "anonymous";
        return trimmed;
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
