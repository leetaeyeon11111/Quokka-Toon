// 웹툰 상세 미디어믹스 — 와이어프레임: 드라마화 작품 한정 나무위키 안내 + 시청 링크
// 백엔드 mediaMix가 오면 API 값을 우선하고, 없으면 제목 키로 보강한다.

export const MEDIA_TYPE_LABEL = {
  movie: '영화',
  tv_drama: 'TV 드라마',
  web_drama: '웹드라마 / OTT',
  animation: '애니메이션',
}

export const MEDIA_TYPE_ICON = {
  movie: '🎬',
  tv_drama: '📺',
  web_drama: '📱',
  animation: '✏️',
}

const BY_TITLE = {
  여신강림: [
    {
      mediaType: 'tv_drama',
      mediaTitle: '여신강림',
      year: 2020,
      platform: 'tvN',
      status: 'released',
      namuWikiUrl: 'https://namu.wiki/w/여신강림',
      watchLinks: [{ url: 'https://tvn.cjenm.com/', label: 'tvN' }],
    },
  ],
  '나 혼자만 레벨업': [
    {
      mediaType: 'animation',
      mediaTitle: '나 혼자만 레벨업',
      year: 2024,
      platform: 'Crunchyroll',
      status: 'released',
      namuWikiUrl: 'https://namu.wiki/w/나 혼자만 레벨업',
      watchLinks: [{ url: 'https://www.crunchyroll.com/', label: 'Crunchyroll' }],
    },
  ],
  '전지적 독자 시점': [
    {
      mediaType: 'movie',
      mediaTitle: '전지적 독자 시점',
      year: 2025,
      platform: '극장',
      status: 'upcoming',
      namuWikiUrl: 'https://namu.wiki/w/전지적 독자 시점',
      watchLinks: [],
    },
  ],
}

export function mediaMixByTitle(title) {
  if (!title) return []
  return BY_TITLE[title] ?? []
}

/** 시청 링크에서 제외 (예고·클립 등) */
const SKIP_WATCH_LABELS = new Set(['네이버tv', '네이버 tv', 'navertv', 'naver tv'])

/**
 * 같은 서비스면 하나로 묶는 키.
 * 훌루는 디즈니+와 동일 서비스로 취급.
 */
function watchServiceKey(link) {
  const label = String(link?.label ?? '').trim().toLowerCase()
  const url = String(link?.url ?? '').trim().toLowerCase()
  if (!label && !url) return ''

  if (
    label.includes('hulu') ||
    label.includes('훌루') ||
    url.includes('hulu.com') ||
    label.includes('disney') ||
    label.includes('디즈니') ||
    url.includes('disneyplus.com') ||
    url.includes('disney+')
  ) {
    return 'disney+'
  }
  if (label.includes('netflix') || label.includes('넷플릭스') || url.includes('netflix.com')) {
    return 'netflix'
  }
  if (label.includes('coupang') || label.includes('쿠팡') || url.includes('coupangplay.com')) {
    return 'coupangplay'
  }
  if (label.includes('wavve') || label.includes('웨이브') || url.includes('wavve.com')) {
    return 'wavve'
  }
  if (label.includes('kakao') || label.includes('카카오') || url.includes('tv.kakao.com')) {
    return 'kakaotv'
  }
  if (label.includes('mbc') || url.includes('imbc.com')) return 'mbc'
  if (label || url) return `raw:${label || url}`
  return ''
}

function shouldSkipWatchLink(link) {
  const label = String(link?.label ?? '').trim().toLowerCase()
  const url = String(link?.url ?? '').trim().toLowerCase()
  if (SKIP_WATCH_LABELS.has(label)) return true
  if (label.includes('네이버tv') || label.includes('네이버 tv')) return true
  if (url.includes('tv.naver.com')) return true
  return false
}

function displayWatchLabel(link, serviceKey) {
  if (serviceKey === 'disney+') return 'Disney+'
  const label = String(link?.label ?? '').trim()
  return label || '보러 가기'
}

/** 네이버TV 제외 · 훌루→디즈니+ · 동일 서비스 중복 제거 */
export function dedupeWatchLinks(links = []) {
  const out = []
  const seen = new Set()
  for (const link of links) {
    if (!link?.url || shouldSkipWatchLink(link)) continue
    const key = watchServiceKey(link)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({
      url: link.url,
      label: displayWatchLabel(link, key),
    })
  }
  return out
}

/** 히어로 버튼용: 여러 미디어믹스 항목의 시청 링크를 한 줄로 합친다. */
export function collectWatchLinks(items = []) {
  return dedupeWatchLinks(items.flatMap((item) => item.watchLinks ?? []))
}

export function normalizeMediaMix(items = []) {
  return items.map((item) => {
    const rawLinks = Array.isArray(item.watchLinks)
      ? item.watchLinks
      : item.watchUrl
        ? [{ url: item.watchUrl, label: '보기' }]
        : []
    return {
      mediaType: item.mediaType || 'etc',
      mediaTitle: item.mediaTitle,
      season: item.season || null,
      year: item.year || null,
      platform: item.platform || '',
      status: item.status || 'released',
      namuWikiUrl: item.namuWikiUrl || item.namu_wiki_url || null,
      watchLinks: dedupeWatchLinks(rawLinks),
    }
  })
}
