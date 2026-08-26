/**
 * 취향 리포트용 태그 필터.
 * 완결/기다무/연재·가격·연령·요일 등 취향과 무관한 메타 태그는 최애 태그 TOP에서 제외한다.
 * (백엔드 ai/filter_meta.py · expand_axis_map.is_noise 와 같은 취지)
 */

const STATUS_EXACT = new Set(['완결', '완결작', '완결됨', '연재중', '연재', '연재작', '휴재'])
const AGE_EXACT = new Set(['19금', '성인', '성인물', '청소년이용불가', '전연령', '전체이용가', '전체이용'])
const MEDIA_EXACT = new Set(['드라마화', '드라마원작', '애니화', '애니메이션화', '영화화', '게임화'])
const PRICE_EXACT = new Set(['무료', '완결무료', '유료'])

/** 요일·시즌 연재 슬롯 (월요웹툰, 화요웹툰 …) */
const WEEKDAY_EXACT = new Set([
  '월요웹툰',
  '화요웹툰',
  '수요웹툰',
  '목요웹툰',
  '금요웹툰',
  '토요웹툰',
  '일요웹툰',
  '매일웹툰',
  '월요',
  '화요',
  '수요',
  '목요',
  '금요',
  '토요',
  '일요',
])

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

/** 부분 일치(포함)로 제외 — 기다무, 기다리면무료 등 */
const META_CONTAINS = ['기다무', '기다리면']

/** 정규식 노이즈 (연도 태그 등) */
const META_REGEX = [/^\d{4}$/, /평점/]

function normalizeTagName(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, '')
}

/**
 * 취향 리포트 최애 태그에 넣으면 안 되는 메타/노이즈 태그인가?
 * @param {string} tagName
 * @returns {boolean}
 */
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
  if (META_REGEX.some((re) => re.test(tag))) return true

  return false
}

/**
 * 태그 카운트 Map/entries에서 노이즈를 빼고 count 내림차순 TOP N.
 * @param {Iterable<[string, number]>} entries
 * @param {number} [top=5]
 * @returns {[string, number][]}
 */
export function rankTasteTags(entries, top = 5) {
  return [...entries]
    .filter(([name]) => !isTasteReportNoiseTag(name))
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
}
