// 백엔드 웹툰 응답 → 프론트 페이지가 기대하는 형태로 매핑.
// DB에 없는 값(성별 통계·평점/조회수 등)은 id 기반 결정론적 mock 으로 채운다.

import { getWebtoon } from '../api/webtoon'
import { mediaMixByTitle, normalizeMediaMix } from '../data/mediaMix'

const COVER_PALETTES = [
  ['#ffb199', '#ff6b6b'], ['#a1c4fd', '#c2e9fb'], ['#f6d365', '#fda085'],
  ['#d4fc79', '#96e6a1'], ['#84fab0', '#8fd3f4'], ['#f5576c', '#f093fb'],
  ['#4facfe', '#00f2fe'], ['#fbc2eb', '#a6c1ee'], ['#c471f5', '#fa71cd'],
  ['#30cfd0', '#330867'],
]

// id 기반 시드 난수 (mulberry32) — 같은 웹툰은 항상 같은 mock 값
function seededRandom(seed) {
  let t = (Number(seed) || 1) >>> 0
  return function next() {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

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

// DB에 rating/view 가 0 이라 화면 표시는 id 기반 mock 으로 채운다.
function synthStats(id) {
  const rnd = seededRandom(id)
  return {
    views: 5000 + Math.round(rnd() * 995000),
    ratingAvg: Number((3.6 + rnd() * 1.3).toFixed(1)),
    commentCount: Math.round(rnd() * 400),
  }
}

function synthDemographics(id, base) {
  const rnd = seededRandom(id + 7)
  const female = 20 + Math.round(rnd() * 60)
  return {
    genderRatio: { male: 100 - female, female },
    genderRating: {
      male: Number((base - 0.4 + rnd() * 0.4).toFixed(2)),
      female: Number((base + 0.1 + rnd() * 0.3).toFixed(2)),
    },
    ageRatings: [
      { age: '10대', avg: Number((base + 0.3).toFixed(2)), count: 60 + Math.round(rnd() * 60) },
      { age: '20대', avg: Number((base - 0.1).toFixed(2)), count: 400 + Math.round(rnd() * 500) },
      { age: '30대', avg: Number((base - 0.3).toFixed(2)), count: 300 + Math.round(rnd() * 500) },
      { age: '40대', avg: Number((base - 0.4).toFixed(2)), count: 80 + Math.round(rnd() * 120) },
      { age: '50대 이상', avg: Number((base - 0.6).toFixed(2)), count: 10 + Math.round(rnd() * 30) },
    ],
  }
}

// 목록 카드용: 백엔드 WebtoonListItem 을 그대로 쓰되 표시용 rating 을 보정
export function toCardModel(item) {
  const rating = item.ratingAvg > 0 ? Number(item.ratingAvg) : synthStats(item.id).ratingAvg
  return {
    id: item.id,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    platformName: item.platformName,
    mainGenre: item.mainGenre,
    ageRating: item.ageRating,
    isAdult: item.ageRating === '19',
    ratingAvg: rating,
  }
}

// 즐겨찾기/인생작 등 id 목록 → 실제 웹툰 상세 모델 배열 (실패한 id 는 제외)
export async function fetchWebtoonModelsByIds(ids) {
  const list = await Promise.all(
    ids.map((id) => getWebtoon(id).then(toDetailModel).catch(() => null)),
  )
  return list.filter(Boolean)
}

// 상세용: WebtoonDetailResponse → 상세페이지가 기대하는 mock 형태
export function toDetailModel(d) {
  const authors = d.authors ?? []
  const writer = authors.find((a) => a.role === 'WRITER')?.name ?? authors[0]?.name ?? '미상'
  const artist = authors.find((a) => a.role === 'ARTIST')?.name ?? writer
  const stats = synthStats(d.id)
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
    catchphrase: (d.summary?.trim() || d.title).slice(0, 40),
    externalUrl: d.externalUrl,
    platforms: [{ name: d.platformName ?? '플랫폼', url: d.externalUrl || '#' }],
    episodeCount: d.episodeCount,
    stats: {
      views: stats.views,
      ratingAvg: stats.ratingAvg,
      ratingCount: d.ratingCount,
      commentCount: stats.commentCount,
      weeklyDay: DAY_KO[d.publishDay] ?? '미정',
    },
    demographics: synthDemographics(d.id, stats.ratingAvg),
    mediaMix: normalizeMediaMix(d.mediaMix?.length ? d.mediaMix : mediaMixByTitle(d.title)),
  }
}
