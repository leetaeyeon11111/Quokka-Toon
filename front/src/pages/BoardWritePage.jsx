import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPost } from '../api/board'
import { listWebtoons } from '../api/webtoon'
import { useAuth } from '../hooks/useAuth'
import { StarsInput } from '../components/common/Stars'
import PlaceholderPage from '../components/common/PlaceholderPage'

export default function BoardWritePage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const [board, setBoard] = useState('free')
  const [webtoons, setWebtoons] = useState([])
  const [webtoonId, setWebtoonId] = useState('')
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listWebtoons()
      .then(setWebtoons)
      .catch(() => setWebtoons([]))
  }, [])

  if (!isLoggedIn) {
    return <PlaceholderPage title="글쓰기" description="글쓰기는 로그인 후 이용할 수 있어요." showDemoLogin />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setError('')
    setSubmitting(true)

    try {
      const postId = await createPost({
        board,
        webtoonId: board === 'webtoon' && webtoonId ? Number(webtoonId) : null,
        title: title.trim(),
        content: content.trim(),
        rating: board === 'webtoon' && rating > 0 ? rating : null,
      })
      navigate(`/board/post/${postId}`)
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
              onClick={() => setBoard(b.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                board === b.key ? 'bg-ink-900 text-white' : 'border border-ink-100 text-ink-500'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {board === 'webtoon' && (
          <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-3">
            <select
              value={webtoonId}
              onChange={(e) => setWebtoonId(e.target.value)}
              className="flex-1 rounded-full border border-ink-100 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">웹툰 선택</option>
              {webtoons.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
            <StarsInput value={rating} onChange={setRating} />
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요."
          className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력해주세요."
          rows={8}
          className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-300"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? '등록 중…' : '등록'}
        </button>
      </form>
    </div>
  )
}
