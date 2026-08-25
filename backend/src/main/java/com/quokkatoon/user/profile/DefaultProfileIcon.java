package com.quokkatoon.user.profile;

import com.quokkatoon.user.dto.ProfileIconResponse;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/** 프론트 public/avatars 에 있는 기본 제공 프로필 아이콘. */
public enum DefaultProfileIcon {
    A1_FANTASY("a1-fantasy", "판타지", "GENRE", "장르", "/avatars/quokka-ip-a1-fantasy.png"),
    A2_ROMANCE("a2-romance", "꽃", "FEMALE", "여성향", "/avatars/quokka-ip-a2-romance.png"),
    A3_ACTION("a3-action", "액션", "GENRE", "장르", "/avatars/quokka-ip-a3-action.png"),
    A4_WUXIA("a4-wuxia", "격투", "GENRE", "장르", "/avatars/quokka-ip-a4-wuxia.png"),
    A5_SCHOOL("a5-school", "학원", "GENRE", "장르", "/avatars/quokka-ip-a5-school.png"),
    A6_GAG("a6-gag", "개그", "GENRE", "장르", "/avatars/quokka-ip-a6-gag.png"),
    A7_MYSTERY("a7-mystery", "추리", "GENRE", "장르", "/avatars/quokka-ip-a7-mystery.png"),
    B1_HEART_EYES("b1-heart-eyes", "로맨스", "FEMALE", "여성향", "/avatars/quokka-ip-b1-heart-eyes.png"),
    B2_NORTH_DUKE("b2-north-duke", "북부대공", "FEMALE", "여성향", "/avatars/quokka-ip-b2-north-duke.png"),
    B3_SOUTH_DUKE("b3-south-duke", "남부대공", "FEMALE", "여성향", "/avatars/quokka-ip-b3-south-duke.png"),
    B4_VILLAINESS("b4-villainess", "악녀", "FEMALE", "여성향", "/avatars/quokka-ip-b4-villainess.png"),
    C1_CROWN("c1-crown", "왕관", "MALE", "남성향", "/avatars/quokka-ip-c1-crown.png"),
    C2_WUXIA_MANUAL("c2-wuxia-manual", "무협지", "MALE", "남성향", "/avatars/quokka-ip-c2-wuxia-manual.png"),
    C3_HUNTER("c3-hunter", "헌터", "MALE", "남성향", "/avatars/quokka-ip-c3-hunter.png");

    private final String id;
    private final String label;
    private final String group;
    private final String groupLabel;
    private final String imageUrl;

    DefaultProfileIcon(String id, String label, String group, String groupLabel, String imageUrl) {
        this.id = id;
        this.label = label;
        this.group = group;
        this.groupLabel = groupLabel;
        this.imageUrl = imageUrl;
    }

    public String id() {
        return id;
    }

    public String imageUrl() {
        return imageUrl;
    }

    public ProfileIconResponse toResponse() {
        return new ProfileIconResponse(id, label, group, groupLabel, imageUrl);
    }

    public static List<ProfileIconResponse> list() {
        return Arrays.stream(values()).map(DefaultProfileIcon::toResponse).toList();
    }

    public static Optional<DefaultProfileIcon> fromId(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(icon -> icon.id.equals(id))
                .findFirst();
    }

    public static Optional<DefaultProfileIcon> fromImageUrl(String url) {
        if (url == null || url.isBlank()) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(icon -> icon.imageUrl.equals(url))
                .findFirst();
    }
}
