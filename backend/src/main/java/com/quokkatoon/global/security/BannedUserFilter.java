package com.quokkatoon.global.security;

import tools.jackson.databind.ObjectMapper;
import com.quokkatoon.global.common.ApiResponse;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.user.dto.BanStatusResponse;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import com.quokkatoon.user.service.BanService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/** JWT 인증 후 정지 계정의 API 호출을 차단한다. ban-status·문의·세션 조회는 예외. */
public class BannedUserFilter extends OncePerRequestFilter {

    private static final Set<String> EXEMPT_PREFIXES = Set.of(
            "/api/auth/ban-status",
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/check-email",
            "/api/auth/check-nickname",
            "/api/auth/social/",
            // 정지 계정도 본인 문의 조회·등록은 허용 (관리자 API 는 /api/admin 이라 여기 안 걸림)
            "/api/inquiries"
    );

    private final UserRepository userRepository;
    private final BanService banService;
    private final ObjectMapper objectMapper;

    public BannedUserFilter(UserRepository userRepository, BanService banService, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.banService = banService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (isExempt(request)) {
            chain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || !(auth.getPrincipal() instanceof Long userId)) {
            chain.doFilter(request, response);
            return;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !user.isBanned()) {
            chain.doFilter(request, response);
            return;
        }

        BanStatusResponse ban = banService.getBanStatus(userId);
        response.setStatus(ErrorCode.USER_BANNED.getStatus().value());
        response.setContentType("application/json;charset=UTF-8");
        objectMapper.writeValue(
                response.getWriter(),
                ApiResponse.fail(ErrorCode.USER_BANNED.getMessage(), ErrorCode.USER_BANNED.name(), ban));
    }

    private boolean isExempt(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) return false;

        // 세션 복원용 프로필 조회만 허용 (닉네임·아이콘 변경 PATCH 는 차단)
        if ("/api/auth/me".equals(uri) && "GET".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        for (String prefix : EXEMPT_PREFIXES) {
            if (uri.startsWith(prefix)) return true;
        }
        return false;
    }
}
