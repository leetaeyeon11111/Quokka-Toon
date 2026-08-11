import { useMemo, useState } from 'react'
import { REPORT_TYPES } from '../../data/reports'
import { INQUIRY_CATEGORIES } from '../../data/inquiries'
import { useAppData } from '../../hooks/useAppData'
import { useAuth } from '../../hooks/useAuth'
import BanModal from '../../components/admin/BanModal'
import PlaceholderPage from '../../components/common/PlaceholderPage'

function ReportsTab() {
  const { reports, resolveReport, banUser } = useAppData()
  const [typeFilter, setTypeFilter] = useState('전체')
  const [banTarget, setBanTarget] = useState(null)

  const filtered = useMemo(
    () => (typeFilter === '전체' ? reports : reports.filter((r) => r.type === typeFilter)),
    [reports, typeFilter],
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-full border border-ink-100 bg-white px-3 py-2 text-xs font-semibold text-ink-700 outline-none"
        >
          <option value="전체">유형: 전체</option>
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm font-semibold text-ink-500">미처리 {filtered.length}건</span>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-100 bg-white py-16 text-center text-sm text-ink-500">
          처리할 신고가 없어요.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((report) => (
            <div key={report.id} className="rounded-xl border border-dashed border-ink-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="mr-2 rounded-full border border-red-300 px-2 py-0.5 text-[11px] font-semibold text-red-500">
                    {report.type}
                  </span>
                  <span className="text-sm font-semibold text-ink-900">{report.title}</span>
                  <p className="mt-1 text-xs text-ink-500">
                    작성자 {report.author} · {report.when} · {report.board}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => alert(`[${report.title}]\n작성자: ${report.author}\n게시판: ${report.board}`)}
                    className="rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    보기
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveReport(report.id)}
                    className="rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    삭제
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanTarget(report)}
                    className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                  >
                    🚫 작성자 벤
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {banTarget && (
        <BanModal
          report={banTarget}
          onClose={() => setBanTarget(null)}
          onConfirm={({ days, reason, deletePost }) => {
            banUser(banTarget.author, days, reason, banTarget.id, deletePost ? banTarget.postId : undefined)
            setBanTarget(null)
          }}
        />
      )}
    </div>
  )
}

function InquiriesTab() {
  const { inquiries, answerInquiry, deleteInquiry } = useAppData()
  const [category, setCategory] = useState('전체')
  const [status, setStatus] = useState('전체')
  const [keyword, setKeyword] = useState('')
  const [openReply, setOpenReply] = useState(null)
  const [draftAnswer, setDraftAnswer] = useState('')

  const filtered = useMemo(() => {
    return inquiries.filter((inq) => {
      if (category !== '전체' && inq.category !== category) return false
      if (status !== '전체' && inq.status !== status) return false
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase()
        if (!inq.title.toLowerCase().includes(kw) && !inq.author.toLowerCase().includes(kw)) return false
      }
      return true
    })
  }, [inquiries, category, status, keyword])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-ink-100 bg-white px-3 py-2 text-xs font-semibold text-ink-700 outline-none"
        >
          <option value="전체">분류: 전체</option>
          {INQUIRY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-full border border-ink-100 bg-white px-3 py-2 text-xs font-semibold text-ink-700 outline-none"
        >
          <option value="전체">상태: 전체</option>
          <option value="답변대기">답변대기</option>
          <option value="답변완료">답변완료</option>
        </select>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="제목·작성자 검색"
          className="rounded-full border border-ink-100 bg-white px-3 py-2 text-xs outline-none"
        />
        <span className="ml-auto text-sm font-semibold text-ink-500">
          {filtered.filter((i) => i.status === '답변대기').length}건 답변대기
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((inq) => (
          <div key={inq.id} className="rounded-xl border border-dashed border-ink-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <span
                  className={`mr-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    inq.status === '답변완료'
                      ? 'bg-mint-100 text-mint-500'
                      : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {inq.status}
                </span>
                <span className="text-sm font-semibold text-ink-900">
                  {inq.category} · {inq.title}
                </span>
                <p className="mt-1 text-xs text-ink-500">
                  작성자 {inq.author} · {inq.date}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpenReply(openReply === inq.id ? null : inq.id)
                    setDraftAnswer(inq.answer || '')
                  }}
                  className="rounded-full bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                >
                  답변
                </button>
                <button
                  type="button"
                  onClick={() => alert(inq.content)}
                  className="rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                >
                  보기
                </button>
                <button
                  type="button"
                  onClick={() => deleteInquiry(inq.id)}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </div>

            {openReply === inq.id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={draftAnswer}
                  onChange={(e) => setDraftAnswer(e.target.value)}
                  placeholder="답변을 입력해주세요."
                  className="flex-1 rounded-full border border-ink-100 bg-ink-50 px-4 py-2 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!draftAnswer.trim()) return
                    answerInquiry(inq.id, draftAnswer)
                    setOpenReply(null)
                  }}
                  className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  등록
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminConsolePage() {
  const { isLoggedIn } = useAuth()
  const [tab, setTab] = useState('reports')

  if (!isLoggedIn) {
    return <PlaceholderPage title="관리자 콘솔" description="로그인 후 이용할 수 있어요." showDemoLogin />
  }

  return (
    <div className="px-6 py-10">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-full bg-ink-900 px-3 py-1.5 text-xs font-bold text-white">🔒 관리자 전용</span>
        <h1 className="text-xl font-bold text-ink-900">
          {tab === 'reports' ? '신고함 — 작성자 제재' : '문의게시판 관리'}
        </h1>
      </div>

      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('reports')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === 'reports' ? 'bg-ink-900 text-white' : 'border border-ink-100 text-ink-500'
          }`}
        >
          신고함
        </button>
        <button
          type="button"
          onClick={() => setTab('inquiries')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === 'inquiries' ? 'bg-ink-900 text-white' : 'border border-ink-100 text-ink-500'
          }`}
        >
          문의게시판
        </button>
      </div>

      {tab === 'reports' ? <ReportsTab /> : <InquiriesTab />}
    </div>
  )
}
