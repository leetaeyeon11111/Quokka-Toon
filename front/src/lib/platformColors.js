// 플랫폼 / 나무위키 브랜드 색 — 상세 바로가기 버튼용.

const DEFAULT = { bg: '#17a389', fg: '#ffffff', border: '#17a389' }

/** @type {Record<string, { bg: string, fg: string, border?: string }>} */
export const PLATFORM_COLORS = {
  네이버웹툰: { bg: '#03C75A', fg: '#ffffff' },
  네이버시리즈: { bg: '#03C75A', fg: '#ffffff' },
  네이버만화: { bg: '#03C75A', fg: '#ffffff' },
  카카오웹툰: { bg: '#191919', fg: '#FEE500' },
  카카오페이지: { bg: '#FEE500', fg: '#191919' },
  다음웹툰: { bg: '#191919', fg: '#FEE500' },
  레진코믹스: { bg: '#E31C39', fg: '#ffffff' },
  리디북스: { bg: '#1F8CE6', fg: '#ffffff' },
  봄툰: { bg: '#FF4D8D', fg: '#ffffff' },
  투믹스: { bg: '#FF6A00', fg: '#ffffff' },
  탑툰: { bg: '#6C5CE7', fg: '#ffffff' },
  미스터블루: { bg: '#0066CC', fg: '#ffffff' },
  조아라: { bg: '#F07A00', fg: '#ffffff' },
  코미코: { bg: '#00B900', fg: '#ffffff' },
  톡소다: { bg: '#FF5A5F', fg: '#ffffff' },
  케이툰: { bg: '#00A8E8', fg: '#ffffff' },
  큐툰: { bg: '#7C4DFF', fg: '#ffffff' },
  왓챠: { bg: '#FF0558', fg: '#ffffff' },
  버프툰: { bg: '#FF7A00', fg: '#ffffff' },
  배틀코믹스: { bg: '#222222', fg: '#ffffff' },
  빅툰: { bg: '#E60012', fg: '#ffffff' },
  동아빅툰: { bg: '#E60012', fg: '#ffffff' },
  원스토어: { bg: '#7C1AFF', fg: '#ffffff' },
  원스토리: { bg: '#7C1AFF', fg: '#ffffff' },
  북큐브: { bg: '#2F6BFF', fg: '#ffffff' },
  네이트툰앤북: { bg: '#E4002B', fg: '#ffffff' },
  피키캐스트: { bg: '#00C2A8', fg: '#ffffff' },
  애니툰: { bg: '#FF3B7A', fg: '#ffffff' },
  애니맥스: { bg: '#E60012', fg: '#ffffff' },
  애니맥스플러스: { bg: '#E60012', fg: '#ffffff' },
  무툰: { bg: '#333333', fg: '#ffffff' },
  아이나무툰: { bg: '#00A495', fg: '#ffffff' },
  웹툰리그: { bg: '#4A90E2', fg: '#ffffff' },
  루리웹: { bg: '#1A73E8', fg: '#ffffff' },
  인스타그램: { bg: '#E1306C', fg: '#ffffff' },
}

/** 나무위키 브랜드 그린 */
export const NAMU_WIKI_COLOR = { bg: '#00A495', fg: '#ffffff', border: '#00A495' }

export function platformButtonStyle(name) {
  const c = (name && PLATFORM_COLORS[name]) || DEFAULT
  return {
    backgroundColor: c.bg,
    color: c.fg,
    borderColor: c.border || c.bg,
  }
}

export function namuWikiButtonStyle() {
  return {
    backgroundColor: NAMU_WIKI_COLOR.bg,
    color: NAMU_WIKI_COLOR.fg,
    borderColor: NAMU_WIKI_COLOR.border,
  }
}
