import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { INQUIRY_CATEGORIES } from '../data/inquiries'
import { createInquiry, listMyInquiries } from '../api/inquiry'
import { isInquiryDone } from '../api/labels'
import { useAuth } from '../hooks/useAuth'
import PlaceholderPage from '../components/common/PlaceholderPage'
import * as authApi from '../api/auth'
import { loadBanStatus } from '../lib/ban'
import { loginHref } from '../lib/navigation'

function InquiryHistoryItem({ inquiry }) {
  const [open, setOpen] = useState(false)
  const isDone = isInquiryDone(inquiry.status)

  return (
    <div className="rounded-xl border border-ink-100 p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
          {inquiry.category}
        </span>
        <span className="flex-1 truncate text-sm font-semibold text-ink-900">{inquiry.title}</span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isDone ? 'bg-mint-100 text-mint-500' : 'bg-ink-100 text-ink-500'
          }`}
        >
          {isDone ? '완료' : inquiry.status}
        </span>
      </div>
      <p className="text-xs text-ink-500">
        {inquiry.date} ·{' '}
        {isDone ? (
          <button type="button" onClick={() => setOpen((o) => !o)} className="underline">
            답변 보기 {open ? '▲' : '▾'}
          </button>
        ) : (
          '접수됨'
        )}
      </p>
      {open && isDone && (
        <p className="mt-2 rounded-lg bg-ink-50 p-3 text-xs text-ink-700">{inquiry.answer}</p>
      )}
    </div>
  )
}

export default function InquiryPage() {
  const { isLoggedIn } = useAuth()
  const [tab, setTab] = useState('write')
  const [myInquiries, setMyInquiries] = useState([])
  const [banned, setBanned] = useState(Boolean(loadBanStatus()?.banned))

  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn) return
    listMyInquiries()
      .then(setMyInquiries)
      .catch(() => setMyInquiries([]))
    authApi
      .getBanStatus()
      .then((status) => setBanned(Boolean(status?.banned)))
      .catch(() => {})
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <PlaceholderPage
        title="문의하기"
        description="문의하기는 로그인 후 이용할 수 있어요. 이용 정지 계정도 로그인하면 문의 접수·내역 확인이 가능합니다."
        loginTo={loginHref('/inquiry')}
      />
    )
  }

  const contentFilled = content.trim().length > 0
  const canSubmit = Boolean(category && title.trim() && contentFilled)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!contentFilled) {
      setError('문의 내용을 입력해주세요.')
      return
    }
    if (!category || !title.trim()) {
      setError(!category ? '문의 항목을 선택해주세요.' : '제목을 입력해주세요.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await createInquiry({ categoryLabel: category, title: title.trim(), content: content.trim() })
      const mine = await listMyInquiries()
      setMyInquiries(mine)
      setCategory('')
      setTitle('')
      setContent('')
      setTab('history')
    } catch (err) {
      setError(err.message ?? '문의 등록에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      {banned && (
        <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
          <p className="font-semibold">이용 정지 중인 계정이에요.</p>
          <p className="mt-1 text-xs leading-5 text-red-600/90">
            문의 접수·내역 확인은 가능합니다. 그 외 서비스 이용은{' '}
            <Link to="/banned" className="font-semibold underline">
              정지 안내
            </Link>
            를 확인해 주세요.
          </p>
        </div>
      )}
      <div className="mb-5 flex gap-2 border-b border-ink-100">
        {[
          { key: 'write', label: '문의하기' },
          { key: 'history', label: '내 문의내역' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t.key ? 'border-brand-500 text-ink-900' : 'border-transparent text-ink-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'write' ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="rounded-xl bg-brand-50 px-4 py-3 text-xs font-medium text-brand-700">
            ⏰ 답변 시간 : 평일 오전 11시 ~ 오후 5시 (공휴일 제외)
          </div>

          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-xl border border-ink-100 bg-ink-50 py-3 pl-4 pr-11 text-sm outline-none"
            >
              <option value="">문의 항목을 선택해주세요.</option>
              {INQUIRY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                <path d="M5.25 7.5 10 12.25 14.75 7.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해주세요."
            className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none"
          />

          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (error) setError('')
            }}
            placeholder="문의 내용을 입력해주세요."
            rows={6}
            className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none"
            aria-invalid={!contentFilled}
          />
          {!contentFilled && (
            <p className="text-xs text-ink-500">문의 내용을 입력해야 확인할 수 있어요.</p>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="mt-1 rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '등록 중…' : '확인'}
          </button>
        </form>
      ) : myInquiries.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-500">아직 문의 내역이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {myInquiries.map((inq) => (
            <InquiryHistoryItem key={inq.id} inquiry={inq} />
          ))}
        </div>
      )}
    </div>
  )
}
