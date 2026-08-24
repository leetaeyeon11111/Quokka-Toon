package com.quokkatoon.user.profile;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DefaultProfileIconTest {

    @Test
    void fromIdRejectsUnknownKeys() {
        assertThat(DefaultProfileIcon.fromId("a1-fantasy")).isPresent();
        assertThat(DefaultProfileIcon.fromId("not-an-icon")).isEmpty();
        assertThat(DefaultProfileIcon.fromId("")).isEmpty();
    }

    @Test
    void imageUrlRoundTrips() {
        DefaultProfileIcon icon = DefaultProfileIcon.B2_NORTH_DUKE;
        assertThat(DefaultProfileIcon.fromImageUrl(icon.imageUrl()))
                .contains(icon);
    }
}
