package com.quokkatoon.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    EMAIL_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    NICKNAME_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    USER_BANNED(HttpStatus.FORBIDDEN, "이용이 정지된 계정입니다."),
    USER_NOT_BANNED(HttpStatus.BAD_REQUEST, "정지 상태가 아닌 사용자입니다."),
    SOCIAL_LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "소셜 로그인에 실패했습니다."),
    WEBTOON_NOT_FOUND(HttpStatus.NOT_FOUND, "웹툰을 찾을 수 없습니다."),
    RECOMMEND_SERVER_ERROR(HttpStatus.BAD_GATEWAY, "추천 서버 호출에 실패했습니다."),
    WEBTOON_LINK_UNAVAILABLE(HttpStatus.BAD_GATEWAY, "바로 보기 링크를 가져오지 못했습니다."),
    UNSUPPORTED_PLATFORM(HttpStatus.BAD_REQUEST, "지원하지 않는 플랫폼입니다."),
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다."),
    REVIEW_ALREADY_EXISTS(HttpStatus.CONFLICT, "이 웹툰에는 이미 리뷰를 작성했습니다."),
    INVALID_POST_TITLE(HttpStatus.BAD_REQUEST, "게시글 제목은 공백을 제외하고 2~200자여야 합니다."),
    INVALID_POST_CONTENT(HttpStatus.BAD_REQUEST, "게시글 본문은 공백을 제외하고 20~10,000자여야 합니다."),
    INVALID_COMMENT_CONTENT(HttpStatus.BAD_REQUEST, "댓글은 공백을 제외하고 5~1,000자여야 합니다."),
    INVALID_REVIEW_CONTENT(HttpStatus.BAD_REQUEST, "리뷰는 공백을 제외하고 20~2,000자여야 합니다."),
    INQUIRY_NOT_FOUND(HttpStatus.NOT_FOUND, "문의를 찾을 수 없습니다."),
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "신고 내역을 찾을 수 없습니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    ALREADY_ADMIN(HttpStatus.BAD_REQUEST, "이미 관리자입니다."),
    ADMIN_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "승격 요청을 찾을 수 없습니다."),
    CANNOT_REVOKE_SELF(HttpStatus.BAD_REQUEST, "본인의 관리자 권한은 해제할 수 없습니다."),
    NOT_ADMIN(HttpStatus.BAD_REQUEST, "관리자가 아닌 사용자입니다."),
    QUICK_PROMPT_NOT_FOUND(HttpStatus.NOT_FOUND, "추천 검색어를 찾을 수 없습니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String message;
}
