import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyComments, listMyPosts } from '../../api/board'
import { listMyReviews } from '../../api/review'
import { coverGradientFor } from '../../lib/webtoon'
import MyPageShell from '../../components/mypage/MyPageShell'
import { StarsDisplay } from '../../components/common/Stars'

const SUB_TABS = [
  { key: 'posts', label: '내가 쓴 게시글' },
  { key: 'comments', label: '내가 쓴 댓글' },
  { key: 'reviews', label: '내가 쓴 리뷰' },
]

const BOARD_LABELS = { free: '자유게시판', webtoon: '웹툰게시판' }

function PostRow({ post }) {
  return (
    <Link
      to={`/board/post/${post.id}`}
      className="flex items-center justify-between gap-3 border-b border-ink-100 py-3 last:border-b-0"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 rounded-full bg-ink-50 px-2 py-1 text-[11px] font-semibold text-ink-500">
          {BOARD_LABELS[post.board] ?? '전체게시판'}
        </span>
        <span className="truncate text-sm font-medium text-ink-900">{post.title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-ink-500">
        <span>
          ♡{post.likes} 💬{post.commentCount ?? post.comments?.length ?? 0}
        </span>
        <span>{post.date}</span>
      </div>
    </Link>
  )
}

function CommentRow({ comment }) {
  return (
    <Link
      to={`/board/post/${comment.postId}`}
      className="flex flex-col gap-1 border-b border-ink-100 py-3 last:border-b-0"
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded-full bg-ink-50 px-2 py-1 text-[11px] font-semibold text-ink-500">
          {BOARD_LABELS[comment.board] ?? '전체게시판'}
        </span>
        <span className="truncate text-xs text-ink-500">{comment.postTitle}</span>
      </div>
      <p className="text-sm text-ink-900">{comment.text}</p>
      <div className="flex items-center gap-3 text-xs text-ink-400">
        <span>👍 {comment.likes}</span>
        <span>{comment.date}</span>
      </div>
    </Link>
  )
}

function ReviewRow({ review }) {
  return (
    <Link
      to={`/webtoons/${review.webtoonId}`}
      className="flex gap-3 rounded-xl border border-ink-100 p-3 hover:bg-ink-50"
    >
      {review.thumbnailUrl ? (
        <img
          src={review.thumbnailUrl}
          alt={review.webtoonTitle}
          className="h-14 w-11 shrink-0 rounded object-cover"
        />
      ) : (
        <div
          className="h-14 w-11 shrink-0 rounded"
          style={{ background: coverGradientFor(review.webtoonId) }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
          {review.webtoonTitle} <StarsDisplay rating={review.rating} size="text-xs" />
        </p>
        <p className="truncate text-sm text-ink-700">"{review.text}"</p>
        <p className="text-xs text-ink-300">👍 {review.likes}</p>
      </div>
    </Link>
  )
}

export default function PostsPage() {
  const [tab, setTab] = useState('posts')
  const [myPosts, setMyPosts] = useState([])
  const [myComments, setMyComments] = useState([])
  const [myReviews, setMyReviews] = useState(null)

  useEffect(() => {
    listMyPosts().then(setMyPosts).catch(() => setMyPosts([]))
    listMyComments().then(setMyComments).catch(() => setMyComments([]))
  }, [])

  useEffect(() => {
    if (tab !== 'reviews' || myReviews !== null) return
    let cancelled = false
    listMyReviews()
      .then((data) => {
        if (!cancelled) setMyReviews(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setMyReviews([])
      })
    return () => {
      cancelled = true
    }
  }, [tab, myReviews])

  return (
    <MyPageShell>
      <div className="mb-4 flex gap-2">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.key ? 'bg-ink-900 text-white' : 'border border-ink-100 text-ink-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        {tab === 'posts' &&
          (myPosts.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-500">아직 작성한 게시글이 없어요.</p>
          ) : (
            myPosts.map((post) => <PostRow key={post.id} post={post} />)
          ))}

        {tab === 'comments' &&
          (myComments.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-500">아직 작성한 댓글이 없어요.</p>
          ) : (
            myComments.map((comment) => <CommentRow key={comment.commentId} comment={comment} />)
          ))}

        {tab === 'reviews' &&
          (myReviews === null ? (
            <p className="py-10 text-center text-sm text-ink-500">리뷰를 불러오는 중…</p>
          ) : myReviews.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-500">아직 작성한 리뷰가 없어요.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {myReviews.map((review) => (
                <ReviewRow key={review.id} review={review} />
              ))}
            </div>
          ))}
      </div>
    </MyPageShell>
  )
}
