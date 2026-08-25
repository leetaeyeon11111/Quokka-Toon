// 랭킹 API를 불러오지 못했을 때만 사용하는, 리뷰가 확인된 실제 작품 목록
export const FALLBACK_TEAM_PICK_IDS = [
  24523, // 게임 속 바바리안으로 살아남기
  24122, // 전지적 독자 시점
  28839, // 귀환자의 마법은 특별해야 합니다
  24772, // 취사병 전설이 되다
  24121, // 화산귀환
]

const EXCLUDED_TEAM_PICK_IDS = new Set([
  44939, // 카카오 가라사대
  27884, // 악녀의 시집살이는 즐겁다
])

export const TEAM_PICK_DRAW_STATE_KEY = 'quokkatoon.teamPickDrawState'

export function reviewedTeamPickIds(webtoons) {
  return [
    ...new Set(
      (webtoons ?? [])
        .filter(
          (webtoon) =>
            Number(webtoon?.ratingCount) > 0 &&
            Number.isInteger(Number(webtoon?.id)) &&
            !EXCLUDED_TEAM_PICK_IDS.has(Number(webtoon?.id)) &&
            !String(webtoon?.title ?? '').includes('테스트'),
        )
        .map((webtoon) => Number(webtoon.id)),
    ),
  ]
}

function shuffledIds(ids, random) {
  const shuffled = [...ids]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

export function drawTeamPick(ids, previousState = {}, random = Math.random) {
  const candidates = [
    ...new Set((ids ?? []).map(Number).filter((id) => Number.isInteger(id))),
  ]
  if (candidates.length === 0) return { id: null, state: null }

  const candidateKey = [...candidates].sort((a, b) => a - b).join(',')
  const candidateSet = new Set(candidates)
  const lastId = candidateSet.has(Number(previousState?.lastId))
    ? Number(previousState.lastId)
    : null
  let remaining =
    previousState?.candidateKey === candidateKey && Array.isArray(previousState?.remaining)
      ? [...new Set(previousState.remaining.map(Number).filter((id) => candidateSet.has(id)))]
      : []

  if (remaining.length === 0) {
    remaining = shuffledIds(candidates, random)
    if (remaining.length > 1 && remaining[0] === lastId) {
      ;[remaining[0], remaining[1]] = [remaining[1], remaining[0]]
    }
  }

  const [id, ...nextRemaining] = remaining
  return {
    id,
    state: { candidateKey, remaining: nextRemaining, lastId: id },
  }
}
