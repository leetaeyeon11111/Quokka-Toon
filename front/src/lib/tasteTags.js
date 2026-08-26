/**
 * 취향 리포트용 태그 필터.
 * 완결/기다무/연재·가격·연령·요일 등 취향과 무관한 메타 태그는 최애 태그 TOP에서 제외한다.
 * (백엔드 ai/filter_meta.py · expand_axis_map.is_noise 와 같은 취지)
 */

const STATUS_EXACT = new Set(['완결', '완결작', '완결됨', '연재중', '연재', '연재작', '휴재'])
const AGE_EXACT = new Set(['19금', '성인', '성인물', '청소년이용불가', '전연령', '전체이용가', '전체이용'])
const MEDIA_EXACT = new Set(['드라마화', '드라마원작', '애니화', '애니메이션화', '영화화', '게임화'])
const PRICE_EXACT = new Set(['무료', '완결무료', '유료', '부분유료'])

const WEEKDAY_EXACT = new Set(['매일웹툰'])

const PLATFORM_META_EXACT = new Set([
  '신작',
  '독점',
  '단행본',
  '웹툰화',
  '컷툰',
  '성인웹툰',
  '해외작품',
  '넥스큐브',
])

const META_CONTAINS = ['기다무', '기다리면']
const META_REGEX = [
  /^\d{4}$/,
  /평점/,
  /^(매주)?(월|화|수|목|금|토|일)요일?(웹툰|연재)?$/,
]

function normalizeTagName(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, '')
}

/** 취향 리포트 최애 태그에 넣으면 안 되는 메타/노이즈 태그인가? */
export function isTasteReportNoiseTag(tagName) {
  const tag = normalizeTagName(tagName)
  if (!tag) return true

  if (STATUS_EXACT.has(tag) || AGE_EXACT.has(tag) || MEDIA_EXACT.has(tag) || PRICE_EXACT.has(tag)) {
    return true
  }
  if (WEEKDAY_EXACT.has(tag) || PLATFORM_META_EXACT.has(tag)) return true

  // 완결로맨스, 완결드라마, 완결판타지 …
  if (tag.startsWith('완결')) return true

  if (META_CONTAINS.some((part) => tag.includes(part))) return true
  if (META_REGEX.some((pattern) => pattern.test(tag))) return true

  return false
}

// jh 쪽에서 사용하던 이름도 호환한다.
export const isTasteMetaTag = isTasteReportNoiseTag

/** 태그 카운트 Map/entries에서 노이즈를 빼고 count 내림차순 TOP N. */
export function rankTasteTags(counts, limit = 5) {
  const entries = counts?.entries?.() ?? counts ?? []
  return [...entries]
    .filter(([name, count]) => !isTasteReportNoiseTag(name) && Number(count) > 0)
    .sort(([nameA, countA], [nameB, countB]) => {
      const countDifference = Number(countB) - Number(countA)
      return countDifference || String(nameA).localeCompare(String(nameB), 'ko')
    })
    .slice(0, Math.max(0, limit))
}
