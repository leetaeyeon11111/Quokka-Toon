import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'
import { nextId } from '../lib/id'
import { StarsDisplay } from '../components/common/Stars'
import PlaceholderPage from '../components/common/PlaceholderPage'

function CommentRow({ comment, postId, onReplyClick, onReact, children }) {
  return (
    <div>
      <div className="rounded-xl border border-ink-100 bg-white p-3">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-900">
          🙂 {comment.author} <span className="text-xs font-normal text-ink-300">{comment.date}</span>
        </p>
        <p className="mb-2 text-sm text-ink-700">{comment.text}</p>
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <button type="button" onClick={() => onReact(postId, comment.id)} className="hover:text-brand-500">
            👍 {comment.likes}
          </button>
          <button type="button" onClick={() => onReplyClick(comment.id)} className="hover:text-brand-500">
            💬 답글
          </button>
          <button type="button" onClick={() => alert('신고가 접수됐어요.')} className="hover:text-red-500">
            🚩 신고
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function BoardPostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { posts, reactPost, reactComment, addComment, deletePost } = useAppData()
  const { user, isLoggedIn } = useAuth()
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  const post = posts.find((p) => p.id === id)

  const topLevelComments = useMemo(
    () => post?.comments.filter((c) => !c.parentId) ?? [],
    [post],
  )
  const repliesOf = (commentId) => post?.comments.filter((c) => c.parentId === commentId) ?? []

  if (!post) {
    return <PlaceholderPage title="게시글을 찾을 수 없어요" description="삭제되었거나 잘못된 주소예요." />
  }

  function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    addComment(post.id, {
      id: nextId('c'),
      author: user?.nickname ?? '익명',
      isMine: true,
      text: commentText,
      likes: 0,
      parentId: null,
      date: '방금 전',
    })
    setCommentText('')
  }

  function submitReply(parentId) {
    if (!replyText.trim()) return
    addComment(post.id, {
      id: nextId('c'),
      author: user?.nickname ?? '익명',
      isMine: true,
      text: replyText,
      likes: 0,
      parentId,
      date: '방금 전',
    })
    setReplyText('')
    setReplyingTo(null)
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <span className="mb-3 inline-block rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-500">
        #{post.board === 'free' ? '자유게시판' : post.board === 'webtoon' ? '웹툰게시판' : '전체게시판'}
        {post.webtoonTag && ` · ${post.webtoonTag}`}
      </span>
      <h1 className="mb-2 text-xl font-bold text-ink-900">{post.title}</h1>
      <div className="mb-5 flex items-center gap-3 text-xs text-ink-500">
        <span>👤 {post.author}</span>
        <span>🗓 {post.date}</span>
        {post.rating && <StarsDisplay rating={post.rating} size="text-xs" />}
        {post.isMine && (
          <button
            type="button"
            onClick={() => {
              if (confirm('게시글을 삭제할까요?')) {
                deletePost(post.id)
                navigate(-1)
              }
            }}
            className="ml-auto text-red-400 hover:text-red-600"
          >
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
          onClick={() => reactPost(post.id, 'like')}
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          👍 추천 {post.likes}
        </button>
        <button
          type="button"
          onClick={() => reactPost(post.id, 'dislike')}
          className="rounded-full border border-ink-100 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
        >
          👎 비추천 {post.dislikes}
        </button>
        <button
          type="button"
          onClick={() => alert('신고가 접수됐어요.')}
          className="rounded-full border border-ink-100 px-5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
        >
          🚩 신고
        </button>
      </div>

      <p className="mb-3 text-sm font-bold text-ink-900">💬 댓글 {post.comments.length}</p>

      {isLoggedIn ? (
        <form onSubmit={submitComment} className="mb-5 flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요…"
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
            postId={post.id}
            onReact={reactComment}
            onReplyClick={(cid) => setReplyingTo(cid === replyingTo ? null : cid)}
            replyingTo={replyingTo}
          >
            <div className="mt-2 flex flex-col gap-2">
              {repliesOf(comment.id).map((reply) => (
                <div key={reply.id} className="ml-8 border-l border-ink-100 pl-4">
                  <div className="rounded-xl bg-ink-50 p-3">
                    <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-900">
                      ↳ 🙂 {reply.author} <span className="text-xs font-normal text-ink-300">{reply.date}</span>
                    </p>
                    <p className="mb-1 text-sm text-ink-700">{reply.text}</p>
                    <button
                      type="button"
                      onClick={() => reactComment(post.id, reply.id)}
                      className="text-xs text-ink-500 hover:text-brand-500"
                    >
                      👍 {reply.likes}
                    </button>
                  </div>
                </div>
              ))}

              {replyingTo === comment.id && (
                <div className="ml-8 flex gap-2 pl-4">
                  <input
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="답글을 입력하세요…"
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
    </div>
  )
}
