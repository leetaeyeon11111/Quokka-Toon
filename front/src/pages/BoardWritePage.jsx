import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createPost } from '../api/board'
import { useAuth } from '../hooks/useAuth'
import { StarsInput } from '../components/common/Stars'
import PlaceholderPage from '../components/common/PlaceholderPage'
import WebtoonSearchPicker from '../components/webtoon/WebtoonSearchPicker'
import { useExperienceNotification } from '../hooks/useExperienceNotification'

function boardFromQuery(params) {
  return params.get('board') === 'webtoon' ? 'webtoon' : 'free'
}

export default function BoardWritePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isLoggedIn } = useAuth()
  const { notifyExperience } = useExperienceNotification()

  const [board, setBoard] = useState(() => boardFromQuery(searchParams))
  const [selectedWebtoon, setSelectedWebtoon] = useState(null)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isLoggedIn) {
    return <PlaceholderPage title="글쓰기" description="글쓰기는 로그인 후 이용할 수 있어요." showDemoLogin />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const normalizedTitle = title.trim()
    const normalizedContent = content.trim()
    if (normalizedTitle.length < 2 || normalizedTitle.length > 200) {
      setError('제목은 공백을 제외하고 2~200자로 입력해주세요.')
      return
    }
    if (normalizedContent.length < 20 || normalizedContent.length > 10000) {
      setError('본문은 공백을 제외하고 20~10,000자로 입력해주세요.')
      return
    }
    if (board === 'webtoon' && !selectedWebtoon?.id) {
      setError('웹툰을 선택해주세요.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const action = await createPost({
        board,
        webtoonId: board === 'webtoon' ? selectedWebtoon.id : null,
        title: normalizedTitle,
        content: normalizedContent,
        rating: board === 'webtoon' && rating > 0 ? rating : null,
      })
      notifyExperience(action.exp)
      navigate(`/board/post/${action.result}`)
    } catch (err) {
      setError(err.message ?? '등록에 실패했어요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-5 text-xl font-bold text-ink-900">글쓰기</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          {[
            { key: 'free', label: '자유게시판' },
            { key: 'webtoon', label: '웹툰게시판' },
          ].map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => {
                setBoard(b.key)
                setSearchParams(b.key === 'webtoon' ? { board: 'webtoon' } : { board: 'free' }, { replace: true })
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                board === b.key ? 'bg-ink-900 text-white' : 'border border-ink-100 text-ink-500'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {board === 'webtoon' && (
          <div className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-ink-50 p-3">
            <WebtoonSearchPicker value={selectedWebtoon} onChange={setSelectedWebtoon} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-500">평점</span>
              <StarsInput value={rating} onChange={setRating} />
            </div>
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요."
          minLength={2}
          maxLength={200}
          className="min-w-0 w-full break-all rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력해주세요."
          rows={8}
          minLength={20}
          maxLength={10000}
          className="min-w-0 w-full break-all [overflow-wrap:anywhere] rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer mt-1 rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? '등록 중…' : '등록'}
        </button>
      </form>
    </div>
  )
}
