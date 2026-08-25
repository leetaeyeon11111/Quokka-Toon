import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getRecommendations } from '../api/recommend'
import RecommendCard from '../components/webtoon/RecommendCard'
import { ResultMessage } from '../components/common/ResultState'

export default function RecommendResultPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const [draftState, setDraftState] = useState({ query, value: query })
  const [requestState, setRequestState] = useState({ query: '', results: [], error: '' })
  const draft = draftState.query === query ? draftState.value : query
  const results = requestState.query === query ? requestState.results : []
  const error = requestState.query === query ? requestState.error : ''
  const loading = Boolean(query && requestState.query !== query)

  useEffect(() => {
    if (!query) return undefined

    let cancelled = false
    getRecommendations(query, { limit: 12 })
      .then((nextResults) => {
        if (!cancelled) setRequestState({ query, results: nextResults, error: '' })
      })
      .catch((requestError) => {
        if (!cancelled) {
          setRequestState({
            query,
            results: [],
            error: requestError.message ?? 'AI 추천을 불러오지 못했어요.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [query])

  function submitSearch(event) {
    event.preventDefault()
    const nextQuery = draft.trim()
    if (!nextQuery) return
    setSearchParams({ q: nextQuery, mode: 'ai' })
  }

  return (
    <div className="px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-900">
          {query ? `'${query}' 검색결과` : 'AI 웹툰 추천'}{' '}
          <span className="align-middle text-xs font-semibold text-brand-500">AI 추천 · 베타</span>
        </h1>
        <p className="mt-1 text-xs text-ink-500">분위기·관계·전개를 바꿔 입력하며 결과를 비교해보세요.</p>
      </div>

      <form onSubmit={submitSearch} className="mb-6 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraftState({ query, value: event.target.value })}
          placeholder="예: 비 오는 날 읽기 좋은 힐링 웹툰"
          aria-label="AI 추천 검색어"
          className="flex-1 rounded-full border border-ink-100 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          다시 추천
        </button>
      </form>

      {!query ? (
        <ResultMessage
          title="보고 싶은 웹툰을 알려주세요"
          description="기분이나 좋아하는 관계, 원하는 전개를 한 문장으로 입력하면 돼요."
        />
      ) : loading ? (
        <ResultMessage
          imageSrc="/quokka_ai_loading.gif"
          imageAlt="추천 작품을 찾으러 달리는 쿼카"
          title="AI가 어울리는 작품을 찾고 있어요"
          description="첫 검색은 모델을 불러오느라 조금 더 걸릴 수 있어요."
        />
      ) : error ? (
        <ResultMessage tone="error" title="AI 추천을 불러오지 못했어요" description={error} />
      ) : results.length === 0 ? (
        <ResultMessage
          title="어울리는 작품을 찾지 못했어요"
          description="다른 분위기나 관계, 전개를 한 문장으로 다시 입력해보세요."
        />
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
