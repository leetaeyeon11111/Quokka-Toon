import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as boardApi from '../api/board'
import { createReport } from '../api/report'
import { useAuth } from '../hooks/useAuth'
import { StarsDisplay } from '../components/common/Stars'
import PlaceholderPage from '../components/common/PlaceholderPage'
import ReportModal from '../components/board/ReportModal'
import { useExperienceNotification } from '../hooks/useExperienceNotification'
import { nicknameLevelClass } from '../lib/level'
import { LevelBadge } from '../components/common/LevelBadge'
import ProfileAvatar from '../components/common/ProfileAvatar'
import { loginHref } from '../lib/navigation'
import { useDialog } from '../hooks/useDialog'

function CommentComposer({ value, onChange, onEscape, placeholder, autoFocus = false, compact = false }) {
  const fieldRef = useRef(null)

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    field.style.height = 'auto'
    field.style.height = `${Math.min(field.scrollHeight, 128)}px`
  }, [value])

  function handleKeyDown(event) {
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault()
      onEscape()
      return
    }
    if (
      event.key !== 'Enter'
      || event.shiftKey
      || event.nativeEvent.isComposing
    ) return

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <div className="min-w-0 flex-1">
      <textarea
        ref={fieldRef}
        autoFocus={autoFocus}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        minLength={5}
        maxLength={1000}
        className={`block max-h-32 w-full resize-none overflow-y-auto border border-ink-100 bg-ink-50 outline-none focus:border-brand-300 ${
          compact
            ? 'min-h-9 rounded-2xl px-4 py-2 text-xs'
            : 'min-h-11 rounded-3xl px-4 py-2.5 text-sm'
        }`}
      />
      <p className={`mt-1 px-3 text-ink-300 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
        Enter 등록 · Shift+Enter 줄바꿈
      </p>
    </div>
  )
}

function CommentRow({ comment, onReplyClick, onReact, onReport, onDelete, children }) {
  return (
    <div>
      <div className="rounded-xl border border-ink-100 bg-white p-3">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-900">
          <ProfileAvatar
            src={comment.authorProfileImageUrl}
            alt=""
            sizeClass="h-6 w-6"
            emojiClass="text-xs"
          />
          <LevelBadge level={comment.authorLevel} />
          <span className={nicknameLevelClass(comment.authorLevel)}>{comment.author}</span>{' '}
          <span className="text-xs font-normal text-ink-300">{comment.date}</span>
        </p>
        <p className="mb-2 max-w-full whitespace-pre-wrap break-all [overflow-wrap:anywhere] text-sm text-ink-700">{comment.text}</p>
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <button type="button" onClick={() => onReact(comment.id)} className={`transition hover:text-brand-500 ${comment.liked ? 'text-brand-500' : ''}`}>
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
  const { alert: showAlert, confirm: showConfirm } = useDialog()

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
      navigate(loginHref(`/board/post/${id}`))
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
      showAlert(err.message ?? '처리에 실패했어요.')
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
      showAlert(err.message ?? '처리에 실패했어요.')
    }
  }

  async function submitComment(e) {
    e.preventDefault()
    const text = commentText.trim()
    if (text.length < 5 || text.length > 1000) {
      showAlert('댓글은 공백을 제외하고 5~1,000자로 입력해주세요.')
      return
    }
    try {
      const action = await boardApi.addComment(post.id, { text })
      setPost((prev) => ({ ...prev, comments: [...prev.comments, action.result] }))
      notifyExperience(action.exp)
      setCommentText('')
    } catch (err) {
      showAlert(err.message ?? '댓글 등록에 실패했어요.')
    }
  }

  async function submitReply(parentId) {
    const text = replyText.trim()
    if (text.length < 5 || text.length > 1000) {
      showAlert('답글은 공백을 제외하고 5~1,000자로 입력해주세요.')
      return
    }
    try {
      const action = await boardApi.addComment(post.id, { text, parentId })
      setPost((prev) => ({ ...prev, comments: [...prev.comments, action.result] }))
      notifyExperience(action.exp)
      setReplyText('')
      setReplyingTo(null)
    } catch (err) {
      showAlert(err.message ?? '답글 등록에 실패했어요.')
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
      showAlert({ title: '신고 접수 완료', message: '신고가 정상적으로 접수됐어요.' })
    } catch (err) {
      showAlert(err.message ?? '신고 접수에 실패했어요.')
    }
  }

  async function handleDelete() {
    const confirmed = await showConfirm({
      title: '게시글 삭제',
      message: '삭제한 게시글은 복구할 수 없어요. 그대로 삭제할까요?',
      confirmLabel: '삭제',
    })
    if (!confirmed) return
    try {
      await boardApi.deletePost(post.id)
      navigate(-1)
    } catch (err) {
      showAlert(err.message ?? '삭제에 실패했어요.')
    }
  }

  async function handleDeleteComment(commentId) {
    const confirmed = await showConfirm({
      title: '댓글 삭제',
      message: '이 댓글과 달린 답글을 함께 삭제할까요?',
      confirmLabel: '삭제',
    })
    if (!confirmed) return
    try {
      await boardApi.deleteComment(commentId)
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.filter((comment) => comment.id !== commentId && comment.parentId !== commentId),
      }))
    } catch (err) {
      showAlert(err.message ?? '댓글 삭제에 실패했어요.')
    }
  }

  if (loading) {
    return <p className="py-24 text-center text-sm text-ink-500">불러오는 중…</p>
  }
  if (notFound || !post) {
    return <PlaceholderPage title="게시글을 찾을 수 없어요" description="삭제되었거나 잘못된 주소예요." />
  }

  return (
    <div className="mx-auto min-w-0 w-full max-w-3xl overflow-x-clip px-6 py-10">
      <button
        type="button"
        onClick={() => navigate(post.board === 'free' ? '/board/free' : '/board/webtoon')}
        className="mb-4 text-sm font-semibold text-ink-500 hover:text-brand-500"
      >
        ← 게시판으로 돌아가기
      </button>
      <span className="mb-3 inline-block rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-500">
        #{post.board === 'free' ? '자유게시판' : post.board === 'webtoon' ? '웹툰게시판' : '전체게시판'}
        {post.webtoonTag && ` · ${post.webtoonTag}`}
      </span>
      <h1 className="mb-2 max-w-full break-all [overflow-wrap:anywhere] text-xl font-bold text-ink-900">{post.title}</h1>
      <div className="mb-5 flex items-center gap-3 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <ProfileAvatar
            src={post.authorProfileImageUrl}
            alt=""
            sizeClass="h-5 w-5"
            emojiClass="text-[10px]"
          />
          <LevelBadge level={post.authorLevel} />
          <span className={nicknameLevelClass(post.authorLevel)}>{post.author}</span>
        </span>
        <span>🗓 {post.date}</span>
        {post.rating && <StarsDisplay rating={post.rating} size="text-xs" />}
        {post.mine && (
          <button type="button" onClick={handleDelete} className="ml-auto text-red-400 hover:text-red-600">
            삭제
          </button>
        )}
      </div>

      <div className="mb-5 min-h-[120px] min-w-0 max-w-full overflow-x-clip whitespace-pre-wrap break-all [overflow-wrap:anywhere] rounded-2xl border border-ink-100 bg-white p-5 text-sm leading-relaxed text-ink-700">
        {post.content}
      </div>

      <div className="mb-8 flex gap-2">
        <button
          type="button"
          onClick={() => handleReactPost('like')}
          aria-label={isLoggedIn ? `추천 ${post.likes}` : '로그인 후 추천 가능'}
          className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            !isLoggedIn
              ? 'bg-ink-100 text-ink-500'
              : post.myReaction?.toLowerCase() === 'like'
              ? 'bg-brand-600 text-white'
              : 'bg-brand-500 text-white hover:bg-brand-600'
          }`}
        >
          👍 추천 {post.likes}
        </button>
        <button
          type="button"
          onClick={() => handleReactPost('dislike')}
          className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
            !isLoggedIn
              ? 'border-ink-100 bg-ink-50 text-ink-300'
              : post.myReaction?.toLowerCase() === 'dislike'
              ? 'border-ink-300 bg-ink-100 text-ink-900'
              : 'border-ink-100 text-ink-700 hover:border-ink-300 hover:bg-ink-100 hover:text-ink-900'
          }`}
        >
          👎 비추천 {post.dislikes}
        </button>
        <button
          type="button"
          onClick={() => handleReport('POST', post.id)}
          className={`rounded-full border border-ink-100 px-5 py-2.5 text-sm font-semibold ${isLoggedIn ? 'text-red-500 hover:bg-red-50' : 'bg-ink-50 text-ink-300'}`}
        >
          🚩 신고
        </button>
      </div>
      {!isLoggedIn && (
        <p className="-mt-5 mb-8 text-xs text-ink-500">추천·비추천·신고는 로그인 후 이용할 수 있어요.</p>
      )}

      <p className="mb-3 text-sm font-bold text-ink-900">💬 댓글 {comments.length}</p>

      {isLoggedIn ? (
        <form onSubmit={submitComment} className="mb-5 flex items-start gap-2">
          <CommentComposer
            value={commentText}
            onChange={setCommentText}
            placeholder="댓글을 입력하세요…"
          />
          <button type="submit" className="shrink-0 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white">
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
            onReplyClick={(cid) => {
              setReplyText('')
              setReplyingTo(cid === replyingTo ? null : cid)
            }}
          >
            <div className="mt-2 flex flex-col gap-2">
              {repliesOf(comment.id).map((reply) => (
                <div key={reply.id} className="ml-8 border-l border-ink-100 pl-4">
                  <div className="rounded-xl bg-ink-50 p-3">
                    <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-900">
                      <span className="text-ink-300">↳</span>
                      <ProfileAvatar
                        src={reply.authorProfileImageUrl}
                        alt=""
                        sizeClass="h-5 w-5"
                        emojiClass="text-[10px]"
                      />
                      <LevelBadge level={reply.authorLevel} />
                      <span className={nicknameLevelClass(reply.authorLevel)}>{reply.author}</span>{' '}
                      <span className="text-xs font-normal text-ink-300">{reply.date}</span>
                    </p>
                    <p className="mb-1 max-w-full whitespace-pre-wrap break-all [overflow-wrap:anywhere] text-sm text-ink-700">{reply.text}</p>
                    <button
                      type="button"
                      onClick={() => handleReactComment(reply.id)}
                      className={`text-xs transition hover:text-brand-500 ${reply.liked ? 'text-brand-500' : 'text-ink-500'}`}
                    >
                      👍 {reply.likes}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReport('COMMENT', reply.id)}
                      className="ml-3 text-xs text-ink-500 hover:text-red-500"
                    >
                      🚩 신고
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
                <form
                  className="ml-8 flex items-start gap-2 pl-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    submitReply(comment.id)
                  }}
                >
                  <CommentComposer
                    autoFocus
                    value={replyText}
                    onChange={setReplyText}
                    onEscape={() => {
                      setReplyText('')
                      setReplyingTo(null)
                    }}
                    placeholder="답글을 입력하세요…"
                    compact
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white"
                  >
                    등록
                  </button>
                </form>
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
