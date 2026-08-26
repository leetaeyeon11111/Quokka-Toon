import AiSummaryMark from '../components/common/AiSummaryMark'
import RecommendCard from '../components/webtoon/RecommendCard'
import { DEFAULT_PROFILE_ICONS } from '../data/defaultProfileIcons'

const AI_MARK = '/icons/quokka-robot-ai-mark.png'

const PROFILE_FROM_ROBOT = DEFAULT_PROFILE_ICONS.filter((i) =>
  ['a8-hero', 'a9-sports', 'a10-sf'].includes(i.id),
)

const MOCK_RESULT = {
  webtoon: {
    id: 24523,
    title: '게임 속 바바리안으로 살아남기',
    authors: { writer: '정윤강', artist: '팀 더 지크' },
    genre: '판타지',
    thumbnailUrl: '',
    coverGradient: 'linear-gradient(135deg, #f6d365, #fda085)',
    catchphrase: '폐급 직업 바바리안으로 빙의한 고인물이, 정체를 숨긴 채 미궁과 원탁을 헤쳐 나간다.',
    synopsis: '9년간 공략하던 게임에 바바리안으로 빙의.',
    isAdult: false,
    platformName: '네이버웹툰',
    platforms: [{ name: '네이버웹툰' }],
  },
  reasonText: '검색어의 생존·전략 키워드와 취향 태그가 겹쳐 추천했어요.',
  queryScore: 88,
  tasteScore: 76,
  total: 82,
  axisTags: [
    { name: '생존', value: 90 },
    { name: '전략', value: 85 },
    { name: '성장', value: 70 },
    { name: '동료', value: 65 },
    { name: '코믹', value: 55 },
  ],
}

export default function AiSummaryMarkMockPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-mint-500">확정 · AI 마크 + 장르 아바타</p>
        <h1 className="text-2xl font-bold text-ink-900">로봇 쿼카 정리</h1>
        <p className="text-sm text-ink-500">
          AI 요약은 페이스플레이트 마크만 쓰고, 나머지 시안은 히어로·스포츠·SF 프로필로 합쳤습니다.
        </p>
        <p className="text-xs text-ink-400">/dev/ai-summary-mark</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink-900">AI 요약 마크</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4">
          <img src={AI_MARK} alt="" className="h-24 w-24 rounded-2xl object-cover object-center" />
          <div className="space-y-2">
            <AiSummaryMark />
            <AiSummaryMark size={36} label="AI 검색" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink-900">프로필 아바타 (장르)</h2>
        <div className="grid grid-cols-3 gap-3">
          {PROFILE_FROM_ROBOT.map((icon) => (
            <div key={icon.id} className="rounded-2xl border border-ink-100 bg-white p-3 text-center">
              <img src={icon.imageUrl} alt={icon.label} className="mx-auto h-24 w-24 rounded-full object-cover" />
              <p className="mt-2 text-sm font-bold text-ink-900">{icon.label}</p>
              <p className="text-[11px] text-ink-400">{icon.id}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink-900">카드 적용 예시</h2>
        <RecommendCard result={MOCK_RESULT} />
      </section>
    </div>
  )
}
