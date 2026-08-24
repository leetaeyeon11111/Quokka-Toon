// 백엔드 웹툰 응답 → 프론트 페이지가 기대하는 형태로 매핑.
// 서버에 없는 통계는 임의로 만들지 않고 null로 유지한다.

import { getWebtoon } from '../api/webtoon'
import { mediaMixByTitle, normalizeMediaMix } from '../data/mediaMix'

const COVER_PALETTES = [
  ['#ffb199', '#ff6b6b'], ['#a1c4fd', '#c2e9fb'], ['#f6d365', '#fda085'],
  ['#d4fc79', '#96e6a1'], ['#84fab0', '#8fd3f4'], ['#f5576c', '#f093fb'],
  ['#4facfe', '#00f2fe'], ['#fbc2eb', '#a6c1ee'], ['#c471f5', '#fa71cd'],
  ['#30cfd0', '#330867'],
]

export function coverGradientFor(id) {
  const [from, to] = COVER_PALETTES[(Number(id) || 0) % COVER_PALETTES.length]
  return `linear-gradient(135deg, ${from}, ${to})`
}

const AGE_LABELS = { ALL: '전체이용가', 12: '12세', 15: '15세', 19: '19세' }
const DAY_KO = { MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일' }
const STATUS_KO = { ONGOING: '연재중', COMPLETED: '완결', HIATUS: '휴재' }

export function ageRatingLabel(v) {
  return AGE_LABELS[v] ?? '전체이용가'
}
export function serialStatusLabel(v) {
  return STATUS_KO[v] ?? v
}

// 목록 카드용: 백엔드 WebtoonListItem을 표시 형태로 정리한다.
export function toCardModel(item) {
  const rating = Number(item.ratingAvg)
  return {
    id: item.id,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    platformName: item.platformName,
    mainGenre: item.mainGenre,
    ageRating: item.ageRating,
    isAdult: item.ageRating === '19',
    ratingAvg: rating > 0 ? rating : null,
  }
}

// 즐겨찾기/인생작 등 id 목록 → 실제 웹툰 상세 모델 배열 (실패한 id 는 제외)
export async function fetchWebtoonModelsByIds(ids) {
  const list = await Promise.all(
    ids.map((id) => getWebtoon(id).then(toDetailModel).catch(() => null)),
  )
  return list.filter(Boolean)
}

// 상세용: WebtoonDetailResponse → 상세페이지 표시 모델
export function toDetailModel(d) {
  const authors = d.authors ?? []
  const writer = authors.find((a) => a.role === 'WRITER')?.name ?? authors[0]?.name ?? '미상'
  const artist = authors.find((a) => a.role === 'ARTIST')?.name ?? writer
  const genre = d.mainGenre ?? d.genres?.[0] ?? '기타'
  return {
    id: d.id,
    backendId: d.id, // 리뷰 API 가 이 값을 우선 사용
    title: d.title,
    thumbnailUrl: d.thumbnailUrl,
    illustrationUrl: d.illustrationUrl,
    coverGradient: coverGradientFor(d.id),
    genre,
    genres: d.genres ?? [],
    ageRating: ageRatingLabel(d.ageRating),
    isAdult: d.ageRating === '19',
    serialStatus: serialStatusLabel(d.serialStatus),
    publishDay: d.publishDay,
    authors: { writer, artist },
    tags: (d.tags ?? []).map((name) => ({ name })),
    synopsis: d.summary?.trim() || '등록된 줄거리가 아직 없어요.',
    aiSummary: d.aiSummary?.trim() || null,
    externalUrl: d.externalUrl,
    platforms: d.externalUrl
      ? [{ name: d.platformName ?? '플랫폼', url: d.externalUrl }]
      : [],
    episodeCount: d.episodeCount,
    stats: {
      views: Number(d.viewCount) || 0,
      ratingAvg: Number(d.ratingAvg) || 0,
      ratingCount: Number(d.ratingCount) || 0,
      bookmarkCount: Number(d.bookmarkCount) || 0,
      weeklyDay: DAY_KO[d.publishDay] ?? '미정',
    },
    demographics: null,
    mediaMix: normalizeMediaMix(d.mediaMix?.length ? d.mediaMix : mediaMixByTitle(d.title)),
  }
}
