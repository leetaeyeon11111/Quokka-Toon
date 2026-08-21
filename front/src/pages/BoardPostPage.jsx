import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as boardApi from '../api/board'
import { createReport } from '../api/report'
import { useAuth } from '../hooks/useAuth'
import { StarsDisplay } from '../components/common/Stars'
import PlaceholderPage from '../components/common/PlaceholderPage'
import ReportModal from '../components/board/ReportModal'
import { useExperienceNotification } from '../hooks/useExperienceNotification'
import { nicknameLevelClass } from '../lib/level'

function CommentRow({ comment, onReplyClick, onReact, onReport, onDelete, children }) {
  return (
    <div>
      <div className="rounded-xl border border-ink-100 bg-white p-3">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-900">
          🙂 <span className={nicknameLevelClass(comment.authorLevel)}>{comment.author}</span>{' '}
          <span className="text-xs font-normal text-ink-300">{comment.date}</span>
        </p>
        <p className="mb-2 text-sm text-ink-700">{comment.text}</p>
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <button type="button" onClick={() => onReact(comment.id)} className="hover:text-brand-500">
            👍 {comment.likes}
          </button>
          <button type="button" onClick={() => onReplyClick(comment.id)} className="hover:text-brand-500">
            💬 답글
          </button>
          <button type="button" onClick={() => onReport(comment.id)} className="hover:text-red-500">
            🚩 신고
          </button>
          {comment.mine && (
            <button type="button" onClick={() => onDelete(comment.id)} className="hover:text-red-500">
              삭제
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

export default function BoardPostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { notifyExperience } = useExperienceNotification()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [reportTarget, setReportTarget] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetchPost() {
      setLoading(true)
      try {
        const data = await boardApi.getPost(id)
        if (!cancelled) setPost(data)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPost()
    return () => {
      cancelled = true
    }
  }, [id])

  const comments = useMemo(() => post?.comments ?? [], [post])
  const topLevelComments = useMemo(() => comments.filter((c) => !c.parentId), [comments])
  const repliesOf = (commentId) => comments.filter((c) => c.parentId === commentId)

  function requireLogin() {
    if (!isLoggedIn) {
      alert('로그인 후 이용할 수 있어요.')
      return false
    }
    return true
  }

  async function handleReactPost(kind) {
    if (!requireLogin()) return
    try {
      const action = await boardApi.reactPost(post.id, kind)
      const res = action.result
      setPost((prev) => ({
        ...prev,
        likes: res.likes,
        dislikes: res.dislikes,
        myReaction: res.myReaction,
      }))
    } catch (err) {
      alert(err.message ?? '처리에 실패했어요.')
    }
  }

  async function handleReactComment(commentId) {
    if (!requireLogin()) return
    try {
      const res = await boardApi.reactComment(commentId)
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c.id === commentId ? { ...c, likes: res.likes, liked: res.liked } : c,
        ),
      }))
    } catch (err) {
      alert(err.message ?? '처리에 실패했어요.')
    }
  }

  async function submitComment(e) {
    e.preventDefault()
    const text = commentText.trim()
    if (text.length < 5 || text.length > 1000) {
      alert('댓글은 공백을 제외하고 5~1,000자로 입력해주세요.')
      return
    }
    try {
      const action = await boardApi.addComment(post.id, { text })
      setPost((prev) => ({ ...prev, comments: [...prev.comments, action.result] }))
      notifyExperience(action.exp)
      setCommentText('')
    } catch (err) {
      alert(err.message ?? '댓글 등록에 실패했어요.')
    }
  }

  async function submitReply(parentId) {
    const text = replyText.trim()
    if (text.length < 5 || text.length > 1000) {
      alert('답글은 공백을 제외하고 5~1,000자로 입력해주세요.')
      return
    }
    try {
      const action = await boardApi.addComment(post.id, { text, parentId })
      setPost((prev) => ({ ...prev, comments: [...prev.comments, action.result] }))
      notifyExperience(action.exp)
      setReplyText('')
      setReplyingTo(null)
    } catch (err) {
      alert(err.message ?? '답글 등록에 실패했어요.')
    }
  }

  function handleReport(targetType, targetId) {
    if (!requireLogin()) return
    setReportTarget({ targetType, targetId })
  }

  async function submitReport(typeLabel) {
    try {
      await createReport({ ...reportTarget, typeLabel })
      setReportTarget(null)
      alert('신고가 접수됐어요.')
    } catch (err) {
      alert(err.message ?? '신고 접수에 실패했어요.')
    }
  }

  async function handleDelete() {
    if (!confirm('게시글을 삭제할까요?')) return
    try {
      await boardApi.deletePost(post.id)
      navigate(-1)
    } catch (err) {
      alert(err.message ?? '삭제에 실패했어요.')
    }
  }

  async function handleDeleteComment(commentId) {
    if (!confirm('댓글을 삭제할까요?')) return
    try {
      await boardApi.deleteComment(commentId)
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.filter((comment) => comment.id !== commentId && comment.parentId !== commentId),
      }))
    } catch (err) {
      alert(err.message ?? '댓글 삭제에 실패했어요.')
    }
  }

  if (loading) {
    return <p className="py-24 text-center text-sm text-ink-500">불러오는 중…</p>
  }
  if (notFound || !post) {
    return <PlaceholderPage title="게시글을 찾을 수 없어요" description="삭제되었거나 잘못된 주소예요." />
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <span className="mb-3 inline-block rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-500">
        #{post.board === 'free' ? '자유게시판' : post.board === 'webtoon' ? '웹툰게시판' : '전체게시판'}
        {post.webtoonTag && ` · ${post.webtoonTag}`}
      </span>
      <h1 className="mb-2 text-xl font-bold text-ink-900">{post.title}</h1>
      <div className="mb-5 flex items-center gap-3 text-xs text-ink-500">
        <span>👤 <span className={nicknameLevelClass(post.authorLevel)}>{post.author}</span></span>
        <span>🗓 {post.date}</span>
        {post.rating && <StarsDisplay rating={post.rating} size="text-xs" />}
        {post.mine && (
          <button type="button" onClick={handleDelete} className="ml-auto text-red-400 hover:text-red-600">
            삭제
          </button>
        )}
      </div>

      <div className="mb-5 min-h-[120px] whitespace-pre-wrap rounded-2xl border border-ink-100 bg-white p-5 text-sm leading-relaxed text-ink-700">
        {post.content}
      </div>

      <div className="mb-8 flex gap-2">
        <button
          type="button"
          onClick={() => handleReactPost('like')}
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          👍 추천 {post.likes}
        </button>
        <button
          type="button"
          onClick={() => handleReactPost('dislike')}
          className="rounded-full border border-ink-100 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
        >
          👎 비추천 {post.dislikes}
        </button>
        <button
          type="button"
          onClick={() => handleReport('POST', post.id)}
          className="rounded-full border border-ink-100 px-5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
        >
          🚩 신고
        </button>
      </div>

      <p className="mb-3 text-sm font-bold text-ink-900">💬 댓글 {comments.length}</p>

      {isLoggedIn ? (
        <form onSubmit={submitComment} className="mb-5 flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요…"
            minLength={5}
            maxLength={1000}
            className="flex-1 rounded-full border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-300"
          />
          <button type="submit" className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white">
            등록
          </button>
        </form>
      ) : (
        <p className="mb-5 text-xs text-ink-300">* 댓글 작성은 로그인 후 가능해요.</p>
      )}

      <div className="flex flex-col gap-3">
        {topLevelComments.map((comment) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            onReact={handleReactComment}
            onReport={(cid) => handleReport('COMMENT', cid)}
            onDelete={handleDeleteComment}
            onReplyClick={(cid) => setReplyingTo(cid === replyingTo ? null : cid)}
          >
            <div className="mt-2 flex flex-col gap-2">
              {repliesOf(comment.id).map((reply) => (
                <div key={reply.id} className="ml-8 border-l border-ink-100 pl-4">
                  <div className="rounded-xl bg-ink-50 p-3">
                    <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-900">
                      ↳ 🙂 <span className={nicknameLevelClass(reply.authorLevel)}>{reply.author}</span>{' '}
                      <span className="text-xs font-normal text-ink-300">{reply.date}</span>
                    </p>
                    <p className="mb-1 text-sm text-ink-700">{reply.text}</p>
                    <button
                      type="button"
                      onClick={() => handleReactComment(reply.id)}
                      className="text-xs text-ink-500 hover:text-brand-500"
                    >
                      👍 {reply.likes}
                    </button>
                    {reply.mine && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(reply.id)}
                        className="ml-3 text-xs text-red-400 hover:text-red-600"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {replyingTo === comment.id && isLoggedIn && (
                <div className="ml-8 flex gap-2 pl-4">
                  <input
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="답글을 입력하세요…"
                    minLength={5}
                    maxLength={1000}
                    className="flex-1 rounded-full border border-ink-100 bg-ink-50 px-4 py-2 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => submitReply(comment.id)}
                    className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white"
                  >
                    등록
                  </button>
                </div>
              )}
            </div>
          </CommentRow>
        ))}
      </div>

      {reportTarget && (
        <ReportModal
          target={reportTarget}
          onConfirm={submitReport}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  )
}
