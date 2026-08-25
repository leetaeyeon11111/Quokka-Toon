import { useEffect, useMemo, useState } from 'react'
import { searchWebtoons } from '../../api/webtoon'
import { fetchWebtoonModelsByIds, toCardModel } from '../../lib/webtoon'
import { useAppData } from '../../hooks/useAppData'
import MyPageShell from '../../components/mypage/MyPageShell'
import HorizontalWebtoonSlider from '../../components/webtoon/HorizontalWebtoonSlider'
import LifeWorksModal from '../../components/mypage/LifeWorksModal'

const RANK_LABELS = ['상위 44%', '상위 32%', '상위 24%']
const RANK_ICONS = ['💗', '💜', '👑']

export default function TastePage() {
  const { favorites, lifeWorks, toggleLifeWork } = useAppData()
  const [showLifeWorks, setShowLifeWorks] = useState(false)
  const [sourceWebtoons, setSourceWebtoons] = useState([])
  const [lifeWorkCount, setLifeWorkCount] = useState(0)
  const [recommendations, setRecommendations] = useState([])

  const sourceIds = useMemo(
    () => [...new Set([...Object.keys(favorites), ...lifeWorks.map(String)])],
    [favorites, lifeWorks],
  )

  // 즐겨찾기+인생작 실제 웹툰 로드
  useEffect(() => {
    let cancelled = false
    async function load() {
      const models = await fetchWebtoonModelsByIds(sourceIds)
      if (!cancelled) setSourceWebtoons(models)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [sourceIds])

  // 인생작 실제 조회 수 (버튼 표시용 — 저장 id 중 실제 존재하는 것만)
  useEffect(() => {
    let cancelled = false
    async function load() {
      const models = await fetchWebtoonModelsByIds(lifeWorks.map(String))
      if (!cancelled) setLifeWorkCount(models.length)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lifeWorks])

  const topGenres = useMemo(() => {
    const counts = new Map()
    sourceWebtoons.forEach((w) => counts.set(w.genre, (counts.get(w.genre) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [sourceWebtoons])

  const topTags = useMemo(() => {
    const counts = new Map()
    sourceWebtoons.forEach((w) =>
      w.tags.forEach((tag) => counts.set(tag.name, (counts.get(tag.name) ?? 0) + 1)),
    )
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [sourceWebtoons])

  // 최애 장르 기반 추천 (실 DB)
  useEffect(() => {
    let cancelled = false
    async function run() {
      const topGenre = topGenres[0]?.[0] ?? sourceWebtoons[0]?.genres?.[0]
      if (!topGenre) {
        if (!cancelled) setRecommendations([])
        return
      }
      try {
        const data = await searchWebtoons({ genre: topGenre, size: 14 })
        if (cancelled) return
        const excluded = new Set(sourceIds.map(String))
        setRecommendations(
          (data?.content ?? [])
            .map(toCardModel)
            .filter((w) => !excluded.has(String(w.id)))
            .slice(0, 10),
        )
      } catch {
        /* 추천 실패 무시 */
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [sourceWebtoons, topGenres, sourceIds])

  const maxTagCount = topTags[0]?.[1] ?? 1

  return (
    <MyPageShell>
      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-4">
        <button
          type="button"
          onClick={() => setShowLifeWorks(true)}
          className="flex w-full items-center gap-3 rounded-xl bg-ink-50 p-3 text-left transition hover:bg-ink-100"
        >
          <span className="text-2xl" aria-hidden>
            🗂
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-ink-900">내 인생작 ({lifeWorkCount})</span>
            <span className="block text-xs text-ink-500">클릭하면 인생작 목록 팝업이 열려요</span>
          </span>
          <span className="text-ink-300">›</span>
        </button>
      </div>

      {sourceWebtoons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-100 bg-white py-16 text-center text-sm text-ink-500">
          즐겨찾기하거나 인생작을 담으면 취향 리포트가 만들어져요.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-ink-100 bg-white p-5">
            <p className="mb-1 text-sm font-bold text-ink-900">장르</p>
            <p className="mb-4 text-xs text-ink-500">많이 보고 담은 장르를 분석했어요.</p>
            <div className="flex justify-around">
              {topGenres.map(([genre], i) => (
                <div key={genre} className="text-center">
                  <p className="mb-1 text-2xl">{RANK_ICONS[i]}</p>
                  <p className="text-sm font-bold text-ink-900">{genre}</p>
                  <p className="text-xs text-ink-500">{RANK_LABELS[i]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-5">
            <p className="mb-1 text-sm font-bold text-ink-900">최애 태그</p>
            <p className="mb-4 text-xs text-ink-500">즐겨찾기·인생작의 공통 태그예요.</p>
            {topTags.length === 0 ? (
              <p className="py-2 text-xs text-ink-300">담은 작품에 태그 정보가 아직 없어요.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topTags.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 truncate text-xs font-semibold text-ink-700">#{name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-[#8b5cf6]"
                        style={{ width: `${(count / maxTagCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs text-ink-500">{count}개</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink-900">최애 장르 기반 추천</p>
            {topGenres[0]?.[0] && (
              <span className="rounded-full border border-ink-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-500">
                {topGenres[0][0]} 기반
              </span>
            )}
          </div>
          <HorizontalWebtoonSlider
            items={recommendations}
            ariaLabel="최애 장르 기반 추천 웹툰 목록"
            previousLabel="이전 추천 작품 보기"
            nextLabel="다음 추천 작품 보기"
          />
        </div>
      )}

      {showLifeWorks && (
        <LifeWorksModal
          lifeWorks={lifeWorks}
          onToggle={toggleLifeWork}
          onClose={() => setShowLifeWorks(false)}
        />
      )}
    </MyPageShell>
  )
}
