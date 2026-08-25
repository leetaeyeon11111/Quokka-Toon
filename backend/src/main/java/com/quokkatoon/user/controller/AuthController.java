package com.quokkatoon.user.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.user.dto.*;
import com.quokkatoon.user.service.AuthService;
import com.quokkatoon.user.service.SocialAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SocialAuthService socialAuthService;

    // 이메일 중복 확인 (STEP 1)
    @GetMapping("/check-email")
    public ApiResponse<DuplicateCheckResponse> checkEmail(@RequestParam String email) {
        return ApiResponse.ok(authService.checkEmail(email));
    }

    // 닉네임 중복 확인 (STEP 3)
    @GetMapping("/check-nickname")
    public ApiResponse<DuplicateCheckResponse> checkNickname(@RequestParam String nickname) {
        return ApiResponse.ok(authService.checkNickname(nickname));
    }

    // 회원가입 (STEP 4 제출)
    @PostMapping("/signup")
    public ApiResponse<Long> signup(@Valid @RequestBody SignupRequest req) {
        return ApiResponse.ok(authService.signup(req));
    }

    // 로그인
    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok(authService.login(req));
    }

    // 현재 로그인한 회원 정보 (JWT 필요) — 새로고침 시 세션 복원용
    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(authService.getMe(userId));
    }

    @GetMapping("/profile-icons")
    public ApiResponse<List<ProfileIconResponse>> profileIcons() {
        return ApiResponse.ok(authService.listProfileIcons());
    }

    @PatchMapping("/me/profile-icon")
    public ApiResponse<UserResponse> updateProfileIcon(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateProfileIconRequest req) {
        return ApiResponse.ok(authService.updateProfileIcon(userId, req.iconId()));
    }

    @PatchMapping("/me/nickname")
    public ApiResponse<UserResponse> updateNickname(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateNicknameRequest req) {
        return ApiResponse.ok(authService.updateNickname(userId, req.nickname()));
    }

    // 소셜 로그인 — 프론트 콜백에서 받은 인가 코드를 전달
    @PostMapping("/social/kakao")
    public ApiResponse<TokenResponse> kakao(@Valid @RequestBody SocialLoginRequest req) {
        return ApiResponse.ok(socialAuthService.kakaoLogin(req));
    }

    @PostMapping("/social/naver")
    public ApiResponse<TokenResponse> naver(@Valid @RequestBody SocialLoginRequest req) {
        return ApiResponse.ok(socialAuthService.naverLogin(req));
    }
}
