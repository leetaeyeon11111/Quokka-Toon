import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPosts } from '../api/board'
import { StarsDisplay } from '../components/common/Stars'
import { nicknameLevelClass } from '../lib/level'
import { LevelBadge } from '../components/common/LevelBadge'
import { ResultMessage } from '../components/common/ResultState'

const TABS = [
  { key: 'all', label: '전체게시판', to: '/board' },
  { key: 'free', label: '자유게시판', to: '/board/free' },
  { key: 'webtoon', label: '웹툰게시판', to: '/board/webtoon' },
]

const SORTS = [
  { key: 'latest', label: '최신순' },
  { key: 'likes', label: '좋아요순' },
  { key: 'comments', label: '댓글순' },
]

const PAGE_SIZE = 5

export default function BoardListPage({ boardType = 'all' }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState('latest')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    async function fetchPosts() {
      setLoading(true)
      setError('')
      try {
        const list = await listPosts(boardType)
        if (!cancelled) {
          setPosts(list)
          setPage(1)
        }
      } catch (err) {
        if (!cancelled) setError(err.message ?? '게시글을 불러오지 못했어요.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPosts()
    return () => {
      cancelled = true
    }
  }, [boardType])

  const filtered = useMemo(() => {
    let list = posts
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.author.toLowerCase().includes(kw) ||
          p.webtoonTag?.toLowerCase().includes(kw),
      )
    }
    list = [...list]
    if (sort === 'likes') list.sort((a, b) => b.likes - a.likes)
    else if (sort === 'comments') list.sort((a, b) => b.commentCount - a.commentCount)
    return list
  }, [posts, keyword, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="px-6 py-10">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink-900">
          {TABS.find((tab) => tab.key === boardType)?.label ?? '게시판'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">웹툰 이야기와 취향을 자유롭게 나눠보세요.</p>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              to={tab.to}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab.key === boardType ? 'bg-ink-900 text-white' : 'border border-ink-100 text-ink-500'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-ink-100 bg-white px-3 py-2 text-xs font-semibold text-ink-700 outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                정렬: {s.label}
              </option>
            ))}
          </select>
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            placeholder={boardType === 'webtoon' ? '웹툰 이름으로 검색' : '제목·글쓴이 검색'}
            className="rounded-full border border-ink-100 bg-white px-4 py-2 text-sm outline-none"
          />
          <Link
            to={
              boardType === 'webtoon'
                ? '/board/write?board=webtoon'
                : boardType === 'free'
                  ? '/board/write?board=free'
                  : '/board/write'
            }
            className="shrink-0 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {boardType === 'webtoon' ? '리뷰 쓰기' : '글쓰기'}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="hidden grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b border-ink-100 px-5 py-3 text-xs font-semibold text-ink-500 sm:grid">
          <span>번호</span>
          <span>제목</span>
          <span>별점</span>
          <span>글쓴이</span>
          <span>날짜</span>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-ink-500">불러오는 중…</p>
        ) : error ? (
          <ResultMessage
            tone="error"
            title="게시글을 불러오지 못했어요"
            description={error}
          />
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-ink-500">
            <p>{keyword.trim() ? `'${keyword.trim()}' 검색 결과가 없어요.` : '아직 게시글이 없어요.'}</p>
            {keyword.trim() && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="rounded-full border border-ink-100 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
              >
                검색어 지우기
              </button>
            )}
          </div>
        ) : (
          paged.map((post, i) => (
            <Link
              key={post.id}
              to={`/board/post/${post.id}`}
              className="flex flex-col gap-1 border-b border-ink-100 px-5 py-3 last:border-b-0 hover:bg-ink-50 sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center sm:gap-4"
            >
              <span className="hidden text-xs text-ink-300 sm:block">
                {filtered.length - ((page - 1) * PAGE_SIZE + i)}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                {post.webtoonTag && (
                  <span className="shrink-0 rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                    #{post.webtoonTag}
                  </span>
                )}
                <span className="truncate text-sm font-medium text-ink-900">{post.title}</span>
                {post.commentCount > 0 && (
                  <span className="shrink-0 text-xs text-ink-300">댓글 {post.commentCount}</span>
                )}
              </span>
              <span>{post.rating ? <StarsDisplay rating={post.rating} size="text-xs" /> : <span className="text-xs text-ink-200">-</span>}</span>
              <span className="flex items-center gap-1 text-xs font-semibold">
                <LevelBadge level={post.authorLevel} />
                <span className={`truncate ${nicknameLevelClass(post.authorLevel)}`}>{post.author}</span>
              </span>
              <span className="text-xs text-ink-500">{post.date}</span>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex justify-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-full text-xs font-semibold transition ${
                p === page ? 'bg-ink-900 text-white' : 'border border-ink-100 text-ink-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
