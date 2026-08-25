// 백엔드 웹툰 응답 → 프론트 페이지가 기대하는 형태로 매핑.
// 서버에 없는 통계는 임의로 만들지 않고 null/빈 값으로 유지한다.

import { getWebtoon } from '../api/webtoon'
import { normalizeMediaMix } from '../data/mediaMix'

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

/** 백엔드 0~1 비율 · 목업 0~100 퍼센트 모두 % 로 통일 */
function ratioToPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  const pct = n <= 1 ? n * 100 : n
  return Math.round(pct * 100) / 100
}

function mapDemographics(d) {
  if (!d?.genderRatio) return null
  return {
    genderRatio: {
      male: ratioToPercent(d.genderRatio.male),
      female: ratioToPercent(d.genderRatio.female),
    },
    genderRating: {
      male: d.genderRating?.male != null ? Number(d.genderRating.male) : null,
      female: d.genderRating?.female != null ? Number(d.genderRating.female) : null,
    },
    ageRatings: (d.ageRatings ?? []).map((row) => ({
      age: row.age,
      avg: Number(row.avg) || 0,
      count: Number(row.count) || 0,
    })),
    sampleSize: Number(d.sampleSize) || 0,
  }
}

// 목록 카드용: 백엔드 WebtoonListItem을 표시 형태로 정리한다.
export function toCardModel(item) {
  const rating = Number(item.ratingAvg)
  return {
    id: item.id,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    platformName: item.platformName,
    platformLogoUrl: item.platformLogoUrl ?? null,
    mainGenre: item.mainGenre,
    ageRating: item.ageRating,
    isAdult: item.ageRating === '19',
    ratingAvg: rating > 0 ? rating : null,
    viewCount: Number(item.viewCount) || 0,
    bookmarkCount: Number(item.bookmarkCount) || 0,
    ratingCount: Number(item.ratingCount) || 0,
  }
}

// 즐겨찾기/인생작 등 id 목록 → 실제 웹툰 상세 모델 배열 (실패한 id 는 제외)
export async function fetchWebtoonModelsByIds(ids) {
  const list = await Promise.all(
    ids.map((id) => getWebtoon(id).then(toDetailModel).catch(() => null)),
  )
  return list.filter(Boolean)
}

function uniqueAuthorNames(authors, role) {
  const names = []
  const seen = new Set()
  for (const a of authors ?? []) {
    if (role && a.role !== role) continue
    const raw = String(a?.name ?? '').trim()
    if (!raw || raw === '미상') continue
    // "유담, 밤나기"처럼 한 칸에 여러 명이 들어온 경우도 칩으로 분리
    const parts = raw.split(/\s*[,，、]\s*|\s+&\s+/).map((p) => p.trim()).filter(Boolean)
    for (const name of parts.length ? parts : [raw]) {
      if (!name || name === '미상' || seen.has(name)) continue
      seen.add(name)
      names.push(name)
    }
  }
  return names
}

// 상세용: WebtoonDetailResponse → 상세페이지 표시 모델
export function toDetailModel(d) {
  const authors = d.authors ?? []
  const writers = uniqueAuthorNames(authors, 'WRITER')
  const artists = uniqueAuthorNames(authors, 'ARTIST')
  // ARTIST 없으면 글작가와 동일 인물로 간주 (1인 창작)
  const artistNames = artists.length ? artists : writers
  const writer = writers[0] ?? authors[0]?.name ?? '미상'
  const artist = artistNames[0] ?? writer
  const genre = d.mainGenre ?? d.genres?.[0] ?? '기타'
  return {
    id: d.id,
    backendId: d.id,
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
    authors: {
      writer,
      artist,
      writers: writers.length ? writers : writer !== '미상' ? [writer] : [],
      artists: artistNames.length ? artistNames : artist !== '미상' ? [artist] : [],
    },
    tags: (d.tags ?? []).map((name) => ({ name })),
    synopsis: d.summary?.trim() || '등록된 줄거리가 아직 없어요.',
    aiSummary: d.aiSummary?.trim() || null,
    externalUrl: d.externalUrl,
    platformName: d.platformName ?? null,
    platformLogoUrl: d.platformLogoUrl ?? null,
    platforms: (d.platforms?.length
      ? d.platforms.map((p) => ({
          name: p.name,
          url: p.url,
          isPrimary: p.isPrimary,
          logoUrl: p.logoUrl ?? null,
        }))
      : d.externalUrl
        ? [{ name: d.platformName ?? '플랫폼', url: d.externalUrl, logoUrl: d.platformLogoUrl ?? null }]
        : []
    ).filter((p) => {
      const u = String(p.url || '')
      if (!u.startsWith('http')) return false
      if (/google\./i.test(u)) return false
      return true
    }),
    episodeCount: d.episodeCount,
    stats: {
      views: Number(d.viewCount) || 0,
      ratingAvg: Number(d.ratingAvg) || 0,
      ratingCount: Number(d.ratingCount) || 0,
      bookmarkCount: Number(d.bookmarkCount) || 0,
      weeklyDay: DAY_KO[d.publishDay] ?? '미정',
    },
    demographics: mapDemographics(d.demographics),
    mediaMix: normalizeMediaMix(d.mediaMix ?? []),
  }
}
