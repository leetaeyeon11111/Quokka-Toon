package com.quokkatoon.webtoon.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class WebtoonViewerKeyTest {

    @Test
    void sameViewerProducesSamePseudonymousKey() {
        assertThat(WebtoonViewerKey.from(null, "visitor_12345678"))
                .isEqualTo(WebtoonViewerKey.from(null, "visitor_12345678"))
                .hasSize(64);
    }

    @Test
    void signedInUsersAndAnonymousVisitorsDoNotShareKeys() {
        assertThat(WebtoonViewerKey.from(7L, "visitor_12345678"))
                .isNotEqualTo(WebtoonViewerKey.from(null, "visitor_12345678"));
    }

    @Test
    void malformedVisitorIdsShareTheConservativeAnonymousBucket() {
        assertThat(WebtoonViewerKey.from(null, "bad value"))
                .isEqualTo(WebtoonViewerKey.from(null, null));
    }
}
