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

export function normalizeMediaMix(items = []) {
  return items.map((item) => {
    const watchLinks = Array.isArray(item.watchLinks)
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
      watchLinks,
    }
  })
}
