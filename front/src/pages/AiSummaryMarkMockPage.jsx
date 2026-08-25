import { useState } from 'react'
import AiSummaryMark from '../components/common/AiSummaryMark'
import RecommendCard from '../components/webtoon/RecommendCard'

/** 임시 확인용 — 로봇 쿼카 AI 요약 마크 */
const V2 = [
  { id: 'A1', src: '/icons/quokka-robot-ai-v2-a1.png', dir: 'A · LED 바이저 헬멧', corner: '좌하' },
  { id: 'A2', src: '/icons/quokka-robot-ai-v2-a2.png', dir: 'A · LED 바이저 헬멧', corner: '우하' },
  { id: 'B1', src: '/icons/quokka-robot-ai-v2-b1.png', dir: 'B · 페이스플레이트+귀볼트', corner: '좌하' },
  { id: 'B2', src: '/icons/quokka-robot-ai-v2-b2.png', dir: 'B · 페이스플레이트+귀볼트', corner: '우하' },
  { id: 'C1', src: '/icons/quokka-robot-ai-v2-c1.png', dir: 'C · 가슴 코어 패널', corner: '좌하' },
  { id: 'C2', src: '/icons/quokka-robot-ai-v2-c2.png', dir: 'C · 가슴 코어 패널', corner: '우하' },
]

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
  const [previewSrc, setPreviewSrc] = useState(V2[2].src) // B1 default preview

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-mint-500">임시 목업 · v2</p>
        <h1 className="text-2xl font-bold text-ink-900">로봇이 된 쿼카 (ip-as-logo)</h1>
        <p className="text-sm text-ink-500">
          기존 쿼카 IP와 같은 단순 실루엣·2색 규칙으로 다시 뽑았습니다. 후보를 고르면 배지/카드 미리보기가
          바뀝니다. 확정 ID를 알려주시면 본 서비스 마크에 적용합니다.
        </p>
        <p className="text-xs text-ink-400">/dev/ai-summary-mark</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink-900">후보 6장</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {V2.map((v) => {
            const active = previewSrc === v.src
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setPreviewSrc(v.src)}
                className={`rounded-2xl border p-3 text-left transition ${
                  active ? 'border-mint-500 bg-mint-100/50 ring-2 ring-mint-500/30' : 'border-ink-100 bg-white'
                }`}
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-ink-900">{v.id}</span>
                  <span className="text-ink-400">{v.corner}</span>
                </div>
                <img src={v.src} alt={v.id} className="mx-auto h-28 w-28 rounded-2xl object-cover" />
                <p className="mt-2 text-[11px] text-ink-500">{v.dir}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink-900">배지 미리보기</h2>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-mint-100 px-1.5 py-0.5 text-[10px] font-bold text-mint-500">
            <img src={previewSrc} alt="" className="h-[18px] w-[18px] rounded-full object-cover" />
            AI 요약
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-mint-100 px-2 py-1 text-xs font-bold text-mint-500">
            <img src={previewSrc} alt="" className="h-6 w-6 rounded-full object-cover" />
            AI 요약
          </span>
          <AiSummaryMark />
          <span className="text-[11px] text-ink-400">(마지막은 현재 서비스 적용본)</span>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink-900">카드 적용 예시</h2>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="mt-2 flex items-start gap-1.5">
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-mint-100 px-1.5 py-0.5 text-[10px] font-bold text-mint-500">
              <img src={previewSrc} alt="" className="h-[18px] w-[18px] rounded-full object-cover" />
              AI 요약
            </span>
            <p className="line-clamp-2 min-w-0 text-xs italic text-ink-500">
              "{MOCK_RESULT.webtoon.catchphrase}"
            </p>
          </div>
        </div>
        <RecommendCard result={MOCK_RESULT} />
      </section>
    </div>
  )
}
