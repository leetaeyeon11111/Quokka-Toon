package com.quokkatoon.user.controller;

import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.user.dto.*;
import com.quokkatoon.user.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
}
