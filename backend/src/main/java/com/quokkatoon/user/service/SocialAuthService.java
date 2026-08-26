package com.quokkatoon.user.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.global.jwt.JwtProvider;
import com.quokkatoon.user.dto.SocialLoginRequest;
import com.quokkatoon.user.dto.TokenResponse;
import com.quokkatoon.user.entity.SocialAccount;
import com.quokkatoon.user.entity.SocialProvider;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.SocialAccountRepository;
import com.quokkatoon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class SocialAuthService {

    private static final Logger log = LoggerFactory.getLogger(SocialAuthService.class);

    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final JwtProvider jwtProvider;
    private final BanService banService;

    @Value("${oauth.kakao.rest-key}")
    private String kakaoRestKey;
    @Value("${oauth.kakao.client-secret:}")
    private String kakaoClientSecret;
    @Value("${oauth.naver.client-id}")
    private String naverClientId;
    @Value("${oauth.naver.client-secret}")
    private String naverClientSecret;

    private final RestClient http = RestClient.create();

    // ---- 카카오 ----
    @Transactional
    public TokenResponse kakaoLogin(SocialLoginRequest req) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("grant_type", "authorization_code");
            form.add("client_id", kakaoRestKey);
            form.add("redirect_uri", req.redirectUri());
            form.add("code", req.code());
            if (kakaoClientSecret != null && !kakaoClientSecret.isBlank()) {
                form.add("client_secret", kakaoClientSecret);
            }

            Map<?, ?> token = http.post()
                    .uri("https://kauth.kakao.com/oauth/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);
            String accessToken = str(token, "access_token");

            Map<?, ?> me = http.get()
                    .uri("https://kapi.kakao.com/v2/user/me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);

            String uid = str(me, "id");
            Map<?, ?> account = obj(me, "kakao_account");
            Map<?, ?> profile = obj(account, "profile");
            String nickname = str(profile, "nickname");
            String image = str(profile, "profile_image_url");
            String email = str(account, "email");   // 대개 없음

            return issue(SocialProvider.KAKAO, uid, email, nickname, image);
        } catch (BusinessException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.error("[social:kakao] {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.SOCIAL_LOGIN_FAILED);
        } catch (Exception e) {
            log.error("[social:kakao] failed", e);
            throw new BusinessException(ErrorCode.SOCIAL_LOGIN_FAILED);
        }
    }

    // ---- 네이버 ----
    @Transactional
    public TokenResponse naverLogin(SocialLoginRequest req) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("grant_type", "authorization_code");
            form.add("client_id", naverClientId);
            form.add("client_secret", naverClientSecret);
            form.add("code", req.code());
            form.add("state", req.state());

            Map<?, ?> token = http.post()
                    .uri("https://nid.naver.com/oauth2.0/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);
            String accessToken = str(token, "access_token");

            Map<?, ?> body = http.get()
                    .uri("https://openapi.naver.com/v1/nid/me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);
            Map<?, ?> res = obj(body, "response");

            String uid = str(res, "id");
            String nickname = str(res, "nickname");
            if (nickname == null) nickname = str(res, "name");
            String image = str(res, "profile_image");
            String email = str(res, "email");

            return issue(SocialProvider.NAVER, uid, email, nickname, image);
        } catch (BusinessException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.error("[social:naver] {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.SOCIAL_LOGIN_FAILED);
        } catch (Exception e) {
            log.error("[social:naver] failed", e);
            throw new BusinessException(ErrorCode.SOCIAL_LOGIN_FAILED);
        }
    }

    // 소셜 계정 조회 → 없으면 생성/연결 → JWT 발급
    private TokenResponse issue(SocialProvider provider, String uid,
                               String email, String nickname, String image) {
        User user = socialAccountRepository.findByProviderAndProviderUid(provider, uid)
                .map(SocialAccount::getUser)
                .orElseGet(() -> linkOrCreate(provider, uid, email, nickname, image));

        // 정지 계정도 JWT 발급 — 문의하기 등 제한적 이용
        String jwt = jwtProvider.createToken(user.getId(), user.getRole().name());
        return new TokenResponse(jwt, user.getId(), user.getNickname(), user.getLevel(), user.getRole().name());
    }

    private User linkOrCreate(SocialProvider provider, String uid,
                              String email, String nickname, String image) {
        // 이메일이 있으면 기존 로컬 계정과 연결, 없으면 합성 이메일로 신규 생성
        String finalEmail = (email != null && !email.isBlank())
                ? email
                : provider.name().toLowerCase() + "_" + uid + "@social.quokkatoon";

        User user = userRepository.findByEmail(finalEmail)
                .orElseGet(() -> userRepository.save(
                        User.socialUser(finalEmail, uniqueNickname(nickname), image)));

        socialAccountRepository.save(SocialAccount.builder()
                .user(user).provider(provider).providerUid(uid).build());
        return user;
    }

    private String uniqueNickname(String base) {
        String name = (base == null || base.isBlank()) ? "쿼카유저" : base.trim();
        if (name.length() > 20) name = name.substring(0, 20);
        String candidate = name;
        int tries = 0;
        while (userRepository.existsByNickname(candidate) && tries < 20) {
            candidate = name + (int) (Math.random() * 10000);
            tries++;
        }
        return candidate;
    }

    private static String str(Map<?, ?> m, String key) {
        Object v = (m == null) ? null : m.get(key);
        return (v == null) ? null : String.valueOf(v);
    }

    private static Map<?, ?> obj(Map<?, ?> m, String key) {
        Object v = (m == null) ? null : m.get(key);
        return (v instanceof Map<?, ?> map) ? map : null;
    }
}
