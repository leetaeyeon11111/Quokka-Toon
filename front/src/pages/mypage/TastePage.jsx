import { useMemo, useState } from 'react'
import { getWebtoonById } from '../../data/webtoons'
import { getRecommendationsByTaste } from '../../api/recommend'
import { useAppData } from '../../hooks/useAppData'
import MyPageShell from '../../components/mypage/MyPageShell'
import WebtoonCard from '../../components/webtoon/WebtoonCard'
import LifeWorksModal from '../../components/mypage/LifeWorksModal'

const RANK_LABELS = ['상위 44%', '상위 32%', '상위 24%']
const RANK_ICONS = ['💗', '💜', '👑']

export default function TastePage() {
  const { favorites, lifeWorks, toggleLifeWork } = useAppData()
  const [showLifeWorks, setShowLifeWorks] = useState(false)

  const sourceIds = useMemo(
    () => [...new Set([...Object.keys(favorites), ...lifeWorks])],
    [favorites, lifeWorks],
  )
  const sourceWebtoons = useMemo(
    () => sourceIds.map(getWebtoonById).filter(Boolean),
    [sourceIds],
  )

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

  const tasteRecommendations = useMemo(
    () => getRecommendationsByTaste(topTags.map(([name]) => name), { excludeIds: sourceIds, limit: 10 }),
    [topTags, sourceIds],
  )

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
            <span className="block text-sm font-bold text-ink-900">내 인생작 ({lifeWorks.length})</span>
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
          </div>
        </div>
      )}

      {tasteRecommendations.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-bold text-ink-900">최애 태그 기반 추천</p>
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
            {tasteRecommendations.map((w) => (
              <WebtoonCard key={w.id} webtoon={w} />
            ))}
          </div>
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
