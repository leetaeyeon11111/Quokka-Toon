package com.quokkatoon.global.config;

import tools.jackson.databind.ObjectMapper;
import com.quokkatoon.global.jwt.JwtAuthenticationFilter;
import com.quokkatoon.global.jwt.JwtProvider;
import com.quokkatoon.global.security.BannedUserFilter;
import com.quokkatoon.user.repository.UserRepository;
import com.quokkatoon.user.service.BanService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final BanService banService;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtProvider jwtProvider, UserRepository userRepository,
                          BanService banService, ObjectMapper objectMapper) {
        this.jwtProvider = jwtProvider;
        this.userRepository = userRepository;
        this.banService = banService;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 현재 회원 조회는 로그인 필요 (permitAll 보다 먼저 선언)
                .requestMatchers("/api/auth/me", "/api/auth/me/**", "/api/auth/ban-status").authenticated()
                // 인증 없이 접근 가능
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/webtoons/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/webtoons/*/view").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/quick-prompts").permitAll()
                .requestMatchers("/api/recommend/**").permitAll()
                // 내가 쓴 글·댓글은 로그인 필요 (공개 GET 보다 먼저 선언)
                .requestMatchers("/api/board/mine", "/api/board/comments/mine").authenticated()
                // 게시판 조회는 공개, 작성/삭제/반응은 로그인 필요
                .requestMatchers(HttpMethod.GET, "/api/board/**").permitAll()
                // 관리자 전용
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // 그 외는 로그인 필요
                .anyRequest().authenticated())
            .addFilterBefore(new JwtAuthenticationFilter(jwtProvider),
                    UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(new BannedUserFilter(userRepository, banService, objectMapper),
                    JwtAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"));
        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
