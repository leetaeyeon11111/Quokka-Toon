import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getRecommendations } from '../api/recommend'
import RecommendCard from '../components/webtoon/RecommendCard'

export default function RecommendResultPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const results = useMemo(() => getRecommendations(query, { limit: 12 }), [query])

  return (
    <div className="px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-900">
          '{query}' 검색결과{' '}
          <span className="align-middle text-xs font-semibold text-brand-500">AI 추천 · 베타</span>
        </h1>
        <p className="mt-1 text-xs text-ink-500">결과 카드에서 탭 전환으로 추천 이유·추천율·줄거리를 확인해보세요.</p>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-center text-ink-500">
          <span className="text-3xl" aria-hidden>
            🐿
          </span>
          <p>검색어와 어울리는 작품을 찾지 못했어요. 다른 문장으로 다시 시도해볼까요?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {results.map((result) => (
            <RecommendCard key={result.webtoon.id} result={result} />
          ))}
        </div>
      )}
    </div>
  )
}
