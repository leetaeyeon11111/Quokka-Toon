package com.quokkatoon.user.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.global.jwt.JwtProvider;
import com.quokkatoon.level.dto.LevelProgressResponse;
import com.quokkatoon.level.service.AttendanceService;
import com.quokkatoon.level.service.ExperienceService;
import com.quokkatoon.user.dto.*;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.profile.DefaultProfileIcon;
import com.quokkatoon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final AttendanceService attendanceService;
    private final ExperienceService experienceService;

    // STEP 1: 이메일 중복 확인
    @Transactional(readOnly = true)
    public DuplicateCheckResponse checkEmail(String email) {
        return new DuplicateCheckResponse(!userRepository.existsByEmail(email));
    }

    // STEP 3: 닉네임 중복 확인
    @Transactional(readOnly = true)
    public DuplicateCheckResponse checkNickname(String nickname) {
        return new DuplicateCheckResponse(!userRepository.existsByNickname(nickname));
    }

    // 최종 가입
    @Transactional
    public Long signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BusinessException(ErrorCode.EMAIL_DUPLICATED);
        }
        if (userRepository.existsByNickname(req.nickname())) {
            throw new BusinessException(ErrorCode.NICKNAME_DUPLICATED);
        }
        User user = User.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .nickname(req.nickname())
                .gender(req.gender())
                .birthDate(req.birthDate())
                .build();
        return userRepository.save(user).getId();
    }

    // 로그인 → JWT 발급
    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        if (user.isBanned()) {
            throw new BusinessException(ErrorCode.USER_BANNED);
        }
        String token = jwtProvider.createToken(user.getId(), user.getRole().name());
        return new TokenResponse(token, user.getId(), user.getNickname(),
                user.getLevel(), user.getRole().name());
    }

    // 현재 로그인한 회원 정보 조회 (GET /api/auth/me)
    @Transactional
    public UserResponse getMe(Long userId) {
        attendanceService.processFirstMeCallOfDay(userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        LevelProgressResponse progress = experienceService.getProgress(userId);
        return UserResponse.from(user, progress);
    }

    @Transactional(readOnly = true)
    public List<ProfileIconResponse> listProfileIcons() {
        return DefaultProfileIcon.list();
    }

    @Transactional
    public UserResponse updateProfileIcon(Long userId, String iconId) {
        DefaultProfileIcon icon = DefaultProfileIcon.fromId(iconId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.updateProfileImageUrl(icon.imageUrl());
        LevelProgressResponse progress = experienceService.getProgress(userId);
        return UserResponse.from(user, progress);
    }

    @Transactional
    public UserResponse updateNickname(Long userId, String nickname) {
        String trimmed = nickname == null ? "" : nickname.trim();
        if (trimmed.isEmpty() || trimmed.length() > 6) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!trimmed.equals(user.getNickname()) && userRepository.existsByNickname(trimmed)) {
            throw new BusinessException(ErrorCode.NICKNAME_DUPLICATED);
        }
        user.updateNickname(trimmed);
        LevelProgressResponse progress = experienceService.getProgress(userId);
        return UserResponse.from(user, progress);
    }
}
