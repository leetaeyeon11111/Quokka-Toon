// 인증 관련 백엔드 API 호출 모듈. (/api/auth/*)

import { api } from './client'

/** 이메일 중복 확인 → { available: boolean } */
export function checkEmail(email) {
  return api.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`, { auth: false })
}

/** 닉네임 중복 확인 → { available: boolean } */
export function checkNickname(nickname) {
  return api.get(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`, { auth: false })
}

/**
 * 회원가입.
 * @param {{ email, password, nickname, gender, birthDate }} payload
 *  - gender: 'M' | 'F' | 'NONE'
 *  - birthDate: 'YYYY-MM-DD'
 * @returns {Promise<number>} 생성된 userId
 */
export function signup(payload) {
  return api.post('/api/auth/signup', payload, { auth: false })
}

/**
 * 로그인.
 * @returns {Promise<{ accessToken, userId, nickname, level, role }>}
 */
export function login(payload) {
  return api.post('/api/auth/login', payload, { auth: false })
}

/** 현재 로그인한 회원 정보 (토큰 필요) */
export function getMe() {
  return api.get('/api/auth/me')
}

/** 기본 제공 프로필 아이콘 목록 */
export function listProfileIcons() {
  return api.get('/api/auth/profile-icons', { auth: false })
}

/** 기본 제공 아이콘으로 프로필 사진 변경 */
export function updateProfileIcon(iconId) {
  return api.patch('/api/auth/me/profile-icon', { iconId })
}
