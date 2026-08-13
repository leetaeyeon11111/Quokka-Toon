// 소셜 로그인 (카카오/네이버) — authorize 리다이렉트 + 백엔드 코드 교환.
//
// 프론트에는 공개키(client_id)만 필요하다. .env 에 넣어둔다:
//   VITE_KAKAO_CLIENT_ID=<카카오 REST API 키>
//   VITE_NAVER_CLIENT_ID=<네이버 Client ID>

import { api } from './client'

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID
const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID

export const kakaoRedirectUri = () => `${window.location.origin}/oauth/kakao/callback`
export const naverRedirectUri = () => `${window.location.origin}/oauth/naver/callback`

// 카카오 인증 페이지로 이동
export function goKakaoAuthorize() {
  if (!KAKAO_CLIENT_ID) {
    alert('카카오 로그인 설정(VITE_KAKAO_CLIENT_ID)이 필요해요.')
    return
  }
  const url =
    'https://kauth.kakao.com/oauth/authorize' +
    `?client_id=${KAKAO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(kakaoRedirectUri())}` +
    '&response_type=code'
  window.location.href = url
}

// 네이버 인증 페이지로 이동 (state 로 CSRF 방지)
export function goNaverAuthorize() {
  if (!NAVER_CLIENT_ID) {
    alert('네이버 로그인 설정(VITE_NAVER_CLIENT_ID)이 필요해요.')
    return
  }
  const state = Math.random().toString(36).slice(2)
  sessionStorage.setItem('naver_oauth_state', state)
  const url =
    'https://nid.naver.com/oauth2.0/authorize' +
    '?response_type=code' +
    `&client_id=${NAVER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(naverRedirectUri())}` +
    `&state=${state}`
  window.location.href = url
}

// 콜백에서 받은 code 를 백엔드로 넘겨 우리 JWT 를 받는다.
export function kakaoLogin(code) {
  return api.post('/api/auth/social/kakao', { code, redirectUri: kakaoRedirectUri() }, { auth: false })
}

export function naverLogin(code, state) {
  return api.post('/api/auth/social/naver', { code, state, redirectUri: naverRedirectUri() }, { auth: false })
}
