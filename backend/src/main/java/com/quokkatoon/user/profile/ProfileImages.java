package com.quokkatoon.user.profile;

import com.quokkatoon.user.entity.User;

/**
 * 게시글·댓글·리뷰 등에서 작성자 아바타로 쓸 URL.
 * 관리자는 관리자 전용 아이콘, 그 외는 설정한 profileImageUrl.
 */
public final class ProfileImages {
    private ProfileImages() {}

    public static String forUser(User user) {
        if (user == null) return null;
        if (user.isAdmin()) return AdminProfileIcon.IMAGE_URL;
        String url = user.getProfileImageUrl();
        return (url == null || url.isBlank()) ? null : url;
    }
}
