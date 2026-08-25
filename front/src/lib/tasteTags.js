const META_TAG_PATTERNS = [
  /^(연재|연재중|완결|휴재)$/i,
  /^(기다무|기다리면\s*무료)$/i,
  /^(무료|유료|부분유료|단행본)$/i,
  /^(월|화|수|목|금|토|일)요(일)?(웹툰|연재)?$/i,
  /^(매주\s*)?(월|화|수|목|금|토|일)요일(\s*연재)?$/i,
]

export function isTasteMetaTag(tag) {
  const normalized = String(tag ?? '').trim()
  return !normalized || META_TAG_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function rankTasteTags(counts, limit = 5) {
  return [...(counts?.entries?.() ?? [])]
    .filter(([name, count]) => !isTasteMetaTag(name) && Number(count) > 0)
    .sort(([nameA, countA], [nameB, countB]) => {
      const countDifference = Number(countB) - Number(countA)
      return countDifference || String(nameA).localeCompare(String(nameB), 'ko')
    })
    .slice(0, Math.max(0, limit))
}
