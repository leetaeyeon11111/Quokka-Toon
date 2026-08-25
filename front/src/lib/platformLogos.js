// 플랫폼 표시명 → 로컬 로고 경로 (사이트 파비콘/브랜드 아이콘).
// DB logo_url 이 없거나 옛 글자 SVG 일 때 폴백으로 쓴다.

export const PLATFORM_LOGO_BY_NAME = {
  네이버웹툰: '/platform-logos/naver_webtoon.ico',
  네이버시리즈: '/platform-logos/naver_series.png',
  네이버만화: '/platform-logos/naver_comic.ico',
  카카오웹툰: '/platform-logos/kakao_webtoon.png',
  카카오페이지: '/platform-logos/kakao_page.png',
  다음웹툰: '/platform-logos/daum_webtoon.png',
  레진코믹스: '/platform-logos/lezhin.png',
  리디북스: '/platform-logos/ridi.png',
  봄툰: '/platform-logos/bomtoon.png',
  투믹스: '/platform-logos/toomics.png',
  탑툰: '/platform-logos/toptoon.png',
  미스터블루: '/platform-logos/mrblue.ico',
  조아라: '/platform-logos/joara.ico',
  원스토리: '/platform-logos/onestory.png',
  원스토어: '/platform-logos/onestore.ico',
  코미코: '/platform-logos/comico.png',
  톡소다: '/platform-logos/tocsoda.png',
  큐툰: '/platform-logos/qtoon.png',
  왓챠: '/platform-logos/watcha.ico',
  케이툰: '/platform-logos/ktoon.png',
  버프툰: '/platform-logos/bufftoon.png',
  배틀코믹스: '/platform-logos/battlecomics.png',
  무툰: '/platform-logos/mutoon.png',
  아이나무툰: '/platform-logos/ainamutoon.png',
  피키캐스트: '/platform-logos/pickycast.png',
  빅툰: '/platform-logos/bigtoon.png',
  동아빅툰: '/platform-logos/bigtoon.png',
  애니툰: '/platform-logos/anitoon.png',
  애니맥스: '/platform-logos/animax.png',
  애니맥스플러스: '/platform-logos/animax.png',
  네이트툰앤북: '/platform-logos/nate_toonbook.png',
  북큐브: '/platform-logos/bookcube.ico',
  인스타그램: '/platform-logos/instagram.webp',
  웹툰리그: '/platform-logos/webtoon_league.png',
  루리웹: '/platform-logos/ruliweb.png',
}

/** 원형 마크 — 흰 원 배경이 자연스러운 플랫폼 */
const CIRCLE_LOGO_NAMES = new Set([
  '리디북스',
  '미스터블루',
  '레진코믹스',
  '왓챠',
  '인스타그램',
])

/**
 * 바로가기 버튼 로고 클립 모양.
 * - circle: 원형 브랜드 마크
 * - rounded: 앱아이콘형(사각·스퀘어클) — 카카오페이지·네이버시리즈 등
 */
export function platformLogoClip(name) {
  if (name && CIRCLE_LOGO_NAMES.has(name)) return 'circle'
  return 'rounded'
}

export function platformLogoFrameClass(name) {
  return platformLogoClip(name) === 'circle'
    ? 'rounded-full bg-white/95 p-0.5'
    : 'rounded-md overflow-hidden'
}

/** DB logo_url 우선. 글자 SVG·빈 값이면 이름 매핑으로 교체 */
export function resolvePlatformLogoUrl(name, logoUrl) {
  const mapped = name ? PLATFORM_LOGO_BY_NAME[name] : null
  if (!logoUrl) return mapped ?? null
  if (/\.svg(\?|$)/i.test(logoUrl) && mapped) return mapped
  return logoUrl
}
