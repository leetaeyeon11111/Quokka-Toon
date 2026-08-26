import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AiSummaryMark from '../components/common/AiSummaryMark'
import RecommendCard from '../components/webtoon/RecommendCard'
import { buildAiPromptSuggestions } from '../lib/aiSearchPrompts'

const AI_QUOKKA = '/icons/quokka-robot-ai-mark.png'

const MOCK_PROMPTS = {
  tags: ['생존', '회귀', '힐링', '사이다', '성장'],
  genres: ['판타지', '로맨스', '액션', '일상'],
  recentAi: [
    '비 오는 날 읽기 좋은 힐링 웹툰',
    '게임 빙의해서 살아남는 이야기',
    '직장 동료랑 설레는 로맨스',
  ],
}

const MOCK_RESULTS = [
  {
    webtoon: {
      id: 24523,
      title: '게임 속 바바리안으로 살아남기',
      authors: { writer: '정윤강', artist: '팀 더 지크' },
      genre: '판타지',
      thumbnailUrl: '',
      coverGradient: 'linear-gradient(135deg, #f6d365, #fda085)',
      catchphrase: '폐급 직업 바바리안으로 빙의한 고인물이, 정체를 숨긴 채 미궁과 원탁을 헤쳐 나간다.',
      synopsis: '9년간 공략하던 게임에 바바리안으로 빙의했다. 약점투성이 직업으로도 최강이 될 수 있을까.',
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
  },
  {
    webtoon: {
      id: 12001,
      title: '이번 생은 가드다',
      authors: { writer: '목업', artist: '쿼카툰' },
      genre: '판타지',
      thumbnailUrl: '',
      coverGradient: 'linear-gradient(135deg, #84fab0, #8fd3f4)',
      catchphrase: '최약체 가드로 회귀한 주인공이, 파티를 지키며 최강으로 성장한다.',
      synopsis: '파티를 지키지 못해 전멸했던 가드가 과거로 돌아왔다. 이번엔 반드시 지켜낸다.',
      isAdult: false,
      platformName: '카카오페이지',
      platforms: [{ name: '카카오페이지' }],
    },
    reasonText: '회귀·성장 흐름이 질문과 잘 맞고, 방어형 주인공 취향과도 맞아요.',
    queryScore: 81,
    tasteScore: 79,
    total: 80,
    axisTags: [
      { name: '회귀', value: 92 },
      { name: '성장', value: 84 },
      { name: '동료', value: 78 },
      { name: '전투', value: 70 },
      { name: '감동', value: 58 },
    ],
  },
  {
    webtoon: {
      id: 8802,
      title: '편의점 옆 힐링 카페',
      authors: { writer: '목업', artist: '쿼카툰' },
      genre: '일상',
      thumbnailUrl: '',
      coverGradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
      catchphrase: '바쁜 하루 끝, 따뜻한 커피 한 잔이 마음을 풀어 준다.',
      synopsis: '야간 편의점과 작은 카페를 오가며 손님들의 사연을 듣는 따뜻한 이야기.',
      isAdult: false,
      platformName: '카카오웹툰',
      platforms: [{ name: '카카오웹툰' }],
    },
    reasonText: '힐링·일상 톤이 강해 분위기를 바꾸고 싶을 때 곁들이기 좋아요.',
    queryScore: 64,
    tasteScore: 71,
    total: 67,
    axisTags: [
      { name: '힐링', value: 95 },
      { name: '일상', value: 88 },
      { name: '감성', value: 72 },
      { name: '관계', value: 60 },
      { name: '코믹', value: 48 },
    ],
  },
]

function AiToggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? 'AI 검색 켜짐' : 'AI 검색 꺼짐'}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full px-1 transition ${
        on ? 'bg-gradient-to-r from-brand-500 to-mint-500' : 'bg-ink-100'
      }`}
    >
      <span
        className={`absolute text-[10px] font-extrabold tracking-wide transition ${
          on ? 'left-1.5 text-white' : 'right-1.5 text-ink-300'
        }`}
      >
        AI
      </span>
      <span
        className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${
          on ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

/**
 * AI 검색 화면 목업 — 실제 API 없이 UI/카피/플로우 확인용.
 * 경로: /dev/ai-search
 */
export default function AiSearchMockPage() {
  const [aiMode, setAiMode] = useState(true)
  const [value, setValue] = useState('')
  const [phase, setPhase] = useState('idle') // idle | searching | done
  const [activeQuery, setActiveQuery] = useState('')
  const [promptSeed, setPromptSeed] = useState(0)

  const prompts = useMemo(
    () =>
      buildAiPromptSuggestions({
        ...MOCK_PROMPTS,
        limit: 6,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [promptSeed]
  )

  useEffect(() => {
    if (phase !== 'searching') return undefined
    const timer = window.setTimeout(() => setPhase('done'), 1200)
    return () => window.clearTimeout(timer)
  }, [phase, activeQuery])

  function runSearch(raw) {
    const q = String(raw ?? value).trim()
    if (!q) return
    setValue(q)
    setActiveQuery(q)
    setPhase('searching')
  }

  const results = phase === 'done' ? MOCK_RESULTS : []

  return (
    <div className="relative min-h-[calc(100svh-var(--site-header-height))] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,#ffe4d1_0%,transparent_45%),radial-gradient(ellipse_at_90%_10%,#e2f7f2_0%,transparent_40%),linear-gradient(180deg,#fff8f3_0%,#f6f5f7_55%)]"
      />

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mint-500">
          임시 목업 · AI 검색
        </p>

        <section className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <div className="relative mb-4">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-full bg-gradient-to-br from-brand-100 to-mint-100 opacity-80 blur-md"
            />
            <img
              src={AI_QUOKKA}
              alt=""
              width={112}
              height={112}
              className="relative h-28 w-28 rounded-full object-cover shadow-md ring-4 ring-white"
            />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-mint-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
              AI
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            AI 쿼카에게 물어보세요
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            분위기·관계·전개를 한 문장으로 말하면, 어울리는 웹툰을 골라 줄게요.
          </p>
          <p className="mt-1 text-[11px] text-ink-300">/dev/ai-search · API 없이 UI만</p>
        </section>

        <section className="rounded-3xl border border-ink-100/80 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!aiMode) {
                setPhase('idle')
                return
              }
              runSearch()
            }}
          >
            <div className="flex items-center gap-2 rounded-full border border-ink-100 bg-white px-2 py-1.5 shadow-sm focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-100/70">
              <AiToggle on={aiMode} onChange={setAiMode} />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={aiMode ? '문장으로 검색해보세요' : '작품, 작가, 태그 검색'}
                aria-label={aiMode ? 'AI 문장 검색' : '일반 검색'}
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-ink-900 outline-none placeholder:text-ink-300"
              />
              <button
                type="submit"
                aria-label="검색"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white transition hover:bg-ink-700"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
              </button>
            </div>
          </form>

          {aiMode ? (
            <>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-500">
                <img
                  src={AI_QUOKKA}
                  alt=""
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full object-cover"
                  aria-hidden
                />
                이 AI는 이미지 생성형이 아니며, 작가님의 소중한 그림은 학습되지 않습니다.
              </p>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-ink-900">AI 추천 문장</h2>
                  <button
                    type="button"
                    onClick={() => setPromptSeed((n) => n + 1)}
                    className="text-xs font-semibold text-mint-500 hover:underline"
                  >
                    다른 문장
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {prompts.map((prompt) => (
                    <button
                      key={`${prompt.label}-${prompt.query}`}
                      type="button"
                      onClick={() => runSearch(prompt.query)}
                      className="rounded-full border border-mint-500/40 bg-gradient-to-r from-mint-100/80 to-brand-50 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <h2 className="mb-2 text-sm font-bold text-ink-900">최근 검색 · AI</h2>
                <div className="flex flex-wrap gap-2">
                  {MOCK_PROMPTS.recentAi.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => runSearch(item)}
                      className="max-w-64 truncate rounded-full bg-ink-50 px-3 py-1.5 text-xs text-ink-700 hover:text-brand-600"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 rounded-2xl bg-ink-50 px-4 py-5 text-center text-xs text-ink-500">
              AI 토글을 켜면 문장 검색 목업이 열려요. 일반 검색은{' '}
              <Link to="/webtoons" className="font-semibold text-brand-600 hover:underline">
                웹툰 목록
              </Link>
              을 이용해 주세요.
            </p>
          )}
        </section>

        <section className="mt-8">
          {phase === 'idle' && (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink-100 bg-white/60 px-6 py-14 text-center">
              <img
                src={AI_QUOKKA}
                alt=""
                className="mb-3 h-16 w-16 rounded-full object-cover opacity-90"
                aria-hidden
              />
              <p className="text-sm font-bold text-ink-900">아직 검색 전이에요</p>
              <p className="mt-1 text-xs text-ink-500">추천 문장을 고르거나, 원하는 분위기를 입력해 보세요.</p>
            </div>
          )}

          {phase === 'searching' && (
            <div className="flex flex-col items-center rounded-3xl border border-ink-100 bg-white px-6 py-14 text-center shadow-sm">
              <img
                src={AI_QUOKKA}
                alt=""
                className="mb-3 h-16 w-16 animate-bounce rounded-full object-cover"
                aria-hidden
              />
              <p className="text-sm font-bold text-ink-900">AI 쿼카가 작품을 고르는 중…</p>
              <p className="mt-1 text-xs text-ink-500">“{activeQuery}”</p>
              <AiSummaryMark className="mt-3" label="AI 검색" />
            </div>
          )}

          {phase === 'done' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-ink-900">
                    ‘{activeQuery}’ 검색결과{' '}
                    <span className="align-middle text-xs font-semibold text-brand-500">AI 추천 · 목업</span>
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                    <AiSummaryMark label="AI 추천" />
                    실제 API 대신 고정 목업 카드 3장이에요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhase('idle')
                    setActiveQuery('')
                  }}
                  className="text-xs font-semibold text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-900"
                >
                  다시 고르기
                </button>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-1">
                {results.map((result) => (
                  <RecommendCard key={result.webtoon.id} result={result} />
                ))}
              </div>
            </div>
          )}
        </section>

        <p className="mt-10 text-center text-[11px] text-ink-300">
          로봇 쿼카 후보 비교는{' '}
          <Link to="/dev/ai-summary-mark" className="underline hover:text-ink-500">
            /dev/ai-summary-mark
          </Link>
        </p>
      </div>
    </div>
  )
}
