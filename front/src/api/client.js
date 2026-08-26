// 공통 HTTP 클라이언트.
//
// 백엔드는 모든 응답을 { success, data, message, code } 형태(ApiResponse)로 내려준다.
// 이 래퍼가 그 껍데기를 벗겨 data 만 반환하고, 실패 시 message 로 에러를 던진다.
// 인증 토큰은 localStorage 에 보관하며 요청마다 Authorization 헤더로 주입한다.

import { emitBanned } from '../lib/ban'

const TOKEN_KEY = 'quakatoon:token'

// 개발: vite proxy 로 상대경로(/api) 사용. 배포: VITE_API_BASE 로 절대 URL 지정 가능.
const BASE_URL = import.meta.env.VITE_API_BASE ?? ''

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// 서버가 명확한 에러 메시지를 줄 때 이 타입으로 던진다. status / code / data 로 분기 가능.
export class ApiError extends Error {
  constructor(message, status, code = null, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}

async function request(method, path, { body, auth = true, signal } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch {
    throw new ApiError('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.', 0)
  }

  // 204 No Content 등 바디가 없는 경우 대비
  const text = await res.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!res.ok || (payload && payload.success === false)) {
    const message = payload?.message ?? `요청에 실패했어요. (${res.status})`
    const code = payload?.code ?? null
    const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : null
    if (code === 'USER_BANNED') {
      emitBanned(data ?? { banned: true })
    }
    throw new ApiError(message, res.status, code, data)
  }

  // ApiResponse 껍데기면 data 만, 아니면 원본 반환
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
}
