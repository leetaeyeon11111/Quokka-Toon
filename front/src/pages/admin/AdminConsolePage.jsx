import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { REPORT_TYPES } from '../../data/reports'
import { INQUIRY_CATEGORIES } from '../../data/inquiries'
import * as adminApi from '../../api/admin'
import { isInquiryDone } from '../../api/labels'
import { useAuth } from '../../hooks/useAuth'
import BanModal from '../../components/admin/BanModal'
import ReportDetailModal from '../../components/admin/ReportDetailModal'
import InquiryDetailModal from '../../components/admin/InquiryDetailModal'
import PlaceholderPage from '../../components/common/PlaceholderPage'
import { useDialog } from '../../hooks/useDialog'

function StatusTag({ done, children }) {
  return (
    <span
      className={`mr-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        done ? 'bg-mint-100 text-mint-500' : 'bg-ink-100 text-ink-500'
      }`}
    >
      {children}
    </span>
  )
}

function ReportsTab({ historyOnly }) {
  const { alert: showAlert } = useDialog()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('전체')
  const [statusFilter, setStatusFilter] = useState('미처리')
  const [banTarget, setBanTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)

  useEffect(() => {
    const loader = historyOnly ? adminApi.listHandledReports : adminApi.listReports
    loader()
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [historyOnly])

  const filtered = useMemo(
    () => (typeFilter === '전체' ? reports : reports.filter((r) => r.type === typeFilter)),
    [reports, typeFilter],
  )

  async function handleResolve(id) {
    try {
      await adminApi.resolveReport(id)
      setReports((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      showAlert(err.message ?? '처리에 실패했어요.')
    }
  }

  async function handleBan({ days, reason, deletePost }) {
    const target = banTarget
    setBanTarget(null)
    try {
      await adminApi.banFromReport(target.id, { duration: days, reason, deletePost })
      setReports((prev) => prev.filter((r) => r.id !== target.id))
    } catch (err) {
      showAlert(err.message ?? '제재에 실패했어요.')
    }
  }

  function showReportDetail(report) {
    showAlert({
      title: report.title,
      message: historyOnly
        ? `작성자: ${report.author}\n게시판: ${report.board}\n상태: ${report.status}`
        : `작성자: ${report.author}\n게시판: ${report.board}`,
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {REPORT_STATUS_TABS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => changeStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === s ? 'bg-ink-900 text-white' : 'border border-ink-100 text-ink-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
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
        <span className="ml-auto text-sm font-semibold text-ink-500">
          {historyOnly ? `완료 기록 ${filtered.length}건` : `미처리 ${filtered.length}건`}
        </span>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-ink-500">불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-100 bg-white py-16 text-center text-sm text-ink-500">
          {historyOnly ? '완료된 신고 기록이 없어요.' : '처리할 신고가 없어요.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((report) => (
            <div key={report.id} className="rounded-xl border border-dashed border-ink-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  {historyOnly && (
                    <StatusTag done={report.status !== '반려'}>
                      {report.status === '반려' ? '반려' : '완료'}
                    </StatusTag>
                  )}
                  <span className="mr-2 rounded-full border border-red-300 px-2 py-0.5 text-[11px] font-semibold text-red-500">
                    {report.type}
                  </span>
                  {report.status !== '미처리' && (
                    <span className="mr-2 rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-semibold text-mint-500">
                      {report.status}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-ink-900">{report.title}</span>
                  <p className="mt-1 text-xs text-ink-500">
                    작성자 {report.author} · {report.when} · {report.board}
                    {historyOnly && report.handledWhen ? ` · 처리 ${report.handledWhen}` : ''}
                  </p>
                  {report.status !== '미처리' && (
                    <p className="mt-0.5 text-xs text-ink-400">
                      처리: {report.handledByName ?? '알 수 없음'}
                      {report.handledDate ? ` · ${report.handledDate}` : ''}
                    </p>
                  )}
                </div>
                {historyOnly ? (
                  <button
                    type="button"
                    onClick={() => showReportDetail(report)}
                    className="rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    보기
                  </button>
                ) : (
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => showReportDetail(report)}
                      className="rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                    >
                      보기
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(report.id)}
                      className="rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                    >
                      반려
                    </button>
                    <button
                      type="button"
                      onClick={() => setBanTarget(report)}
                      className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                    >
                      🚫 작성자 벤
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {banTarget && (
        <BanModal report={banTarget} onClose={() => setBanTarget(null)} onConfirm={handleBan} />
      )}
      {detailTarget && (
        <ReportDetailModal report={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
    </div>
  )
}

function InquiriesTab({ historyOnly }) {
  const { alert: showAlert, confirm: showConfirm } = useDialog()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('전체')
  const [status, setStatus] = useState(historyOnly ? '완료' : '전체')
  const [keyword, setKeyword] = useState('')
  const [openReply, setOpenReply] = useState(null)
  const [draftAnswer, setDraftAnswer] = useState('')
  const [detailInquiry, setDetailInquiry] = useState(null)

  useEffect(() => {
    adminApi
      .listInquiries()
      .then(setInquiries)
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return inquiries.filter((inq) => {
      if (historyOnly && !isInquiryDone(inq.status)) return false
      if (!historyOnly && status === '완료' && !isInquiryDone(inq.status)) return false
      if (!historyOnly && status !== '전체' && status !== '완료' && inq.status !== status) return false
      if (category !== '전체' && inq.category !== category) return false
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase()
        if (!inq.title.toLowerCase().includes(kw) && !inq.author.toLowerCase().includes(kw)) return false
      }
      return true
    })
  }, [inquiries, category, status, keyword, historyOnly])

  async function handleAnswer(id) {
    if (!draftAnswer.trim()) return
    try {
      await adminApi.answerInquiry(id, draftAnswer.trim())
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === id ? { ...inq, status: '완료', answer: draftAnswer.trim() } : inq,
        ),
      )
      setOpenReply(null)
    } catch (err) {
      showAlert(err.message ?? '답변 등록에 실패했어요.')
    }
  }

  async function handleDelete(id) {
    const confirmed = await showConfirm({
      title: '문의 삭제',
      message: '삭제한 문의는 복구할 수 없어요. 그대로 삭제할까요?',
      confirmLabel: '삭제',
    })
    if (!confirmed) return
    try {
      await adminApi.deleteInquiry(id)
      setInquiries((prev) => prev.filter((inq) => inq.id !== id))
    } catch (err) {
      showAlert(err.message ?? '삭제에 실패했어요.')
    }
  }

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
        {!historyOnly && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-full border border-ink-100 bg-white px-3 py-2 text-xs font-semibold text-ink-700 outline-none"
          >
            <option value="전체">상태: 전체</option>
            <option value="답변대기">답변대기</option>
            <option value="완료">완료</option>
          </select>
        )}
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="제목·작성자 검색"
          className="rounded-full border border-ink-100 bg-white px-3 py-2 text-xs outline-none"
        />
        <span className="ml-auto text-sm font-semibold text-ink-500">
          {historyOnly
            ? `완료 기록 ${filtered.length}건`
            : `${filtered.filter((i) => !isInquiryDone(i.status)).length}건 답변대기`}
        </span>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-ink-500">불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-100 bg-white py-16 text-center text-sm text-ink-500">
          {historyOnly ? '완료된 문의 기록이 없어요.' : '문의가 없어요.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((inq) => {
            const done = isInquiryDone(inq.status)
            return (
              <div key={inq.id} className="rounded-xl border border-dashed border-ink-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <StatusTag done={done}>{done ? '완료' : inq.status}</StatusTag>
                    <span className="text-sm font-semibold text-ink-900">
                      {inq.category} · {inq.title}
                    </span>
                    <p className="mt-1 text-xs text-ink-500">
                      작성자 {inq.author} · {inq.date}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {!historyOnly && (
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
                    )}
                    <button
                      type="button"
                      onClick={() => showAlert({ title: inq.title, message: inq.content })}
                      className="rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                    >
                      보기
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(inq.id)}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {historyOnly && done && inq.answer && (
                  <p className="mt-3 rounded-lg bg-mint-100 p-3 text-xs text-ink-700">{inq.answer}</p>
                )}

                {openReply === inq.id && (
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault()
                      handleAnswer(inq.id)
                    }}
                  >
                    <input
                      autoFocus
                      value={draftAnswer}
                      onChange={(e) => setDraftAnswer(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Escape') return
                        setOpenReply(null)
                        setDraftAnswer('')
                      }}
                      placeholder="답변을 입력해주세요."
                      className="flex-1 rounded-full border border-ink-100 bg-ink-50 px-4 py-2 text-xs outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      등록
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}

      {detailInquiry && (
        <InquiryDetailModal inquiry={detailInquiry} onClose={() => setDetailInquiry(null)} />
      )}
    </div>
  )
}

function QuickPromptsTab() {
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState({ label: '', query: '', sortOrder: '' })

  useEffect(() => {
    adminApi
      .listQuickPrompts()
      .then(setPrompts)
      .catch(() => setPrompts([]))
      .finally(() => setLoading(false))
  }, [])

  function changeField(id, field, value) {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  async function handleSave(p) {
    if (!p.label.trim() || !p.query.trim()) {
      alert('버튼 글씨와 검색어를 모두 입력해주세요.')
      return
    }
    setBusy(true)
    try {
      const updated = await adminApi.updateQuickPrompt(p.id, {
        label: p.label.trim(),
        query: p.query.trim(),
        sortOrder: Number(p.sortOrder) || 0,
      })
      setPrompts((prev) => prev.map((x) => (x.id === p.id ? updated : x)))
      alert('저장했어요.')
    } catch (err) {
      alert(err.message ?? '저장에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('이 추천 검색어를 삭제할까요?')) return
    try {
      await adminApi.deleteQuickPrompt(id)
      setPrompts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert(err.message ?? '삭제에 실패했어요.')
    }
  }

  async function handleAdd() {
    if (!draft.label.trim() || !draft.query.trim()) {
      alert('버튼 글씨와 검색어를 모두 입력해주세요.')
      return
    }
    setBusy(true)
    try {
      const created = await adminApi.createQuickPrompt({
        label: draft.label.trim(),
        query: draft.query.trim(),
        sortOrder: Number(draft.sortOrder) || prompts.length + 1,
      })
      setPrompts((prev) => [...prev, created])
      setDraft({ label: '', query: '', sortOrder: '' })
    } catch (err) {
      alert(err.message ?? '추가에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-500">
        메인페이지 검색창 아래의 추천 검색어 버튼을 편집해요. <b>버튼 글씨</b>는 사용자에게 보이는 글자,{' '}
        <b>검색어</b>는 버튼을 눌렀을 때 실제로 실행되는 문장이에요. <b>순서</b>가 작을수록 앞에 표시됩니다.
      </p>

      {loading ? (
        <p className="py-16 text-center text-sm text-ink-500">불러오는 중…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {prompts.map((p) => (
            <div key={p.id} className="rounded-xl border border-dashed border-ink-200 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={p.label}
                  onChange={(e) => changeField(p.id, 'label', e.target.value)}
                  placeholder="버튼 글씨"
                  maxLength={50}
                  className="w-full rounded-full border border-ink-100 bg-white px-4 py-2 text-sm outline-none sm:w-48"
                />
                <input
                  value={p.query}
                  onChange={(e) => changeField(p.id, 'query', e.target.value)}
                  placeholder="검색어(클릭 시 실행)"
                  maxLength={200}
                  className="w-full flex-1 rounded-full border border-ink-100 bg-white px-4 py-2 text-sm outline-none"
                />
                <input
                  value={p.sortOrder}
                  onChange={(e) => changeField(p.id, 'sortOrder', e.target.value)}
                  placeholder="순서"
                  type="number"
                  className="w-full rounded-full border border-ink-100 bg-white px-4 py-2 text-sm outline-none sm:w-20"
                />
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSave(p)}
                    className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 새 추천 검색어 추가 */}
          <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-4">
            <p className="mb-2 text-xs font-semibold text-brand-600">+ 새 추천 검색어 추가</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="버튼 글씨"
                maxLength={50}
                className="w-full rounded-full border border-ink-100 bg-white px-4 py-2 text-sm outline-none sm:w-48"
              />
              <input
                value={draft.query}
                onChange={(e) => setDraft((d) => ({ ...d, query: e.target.value }))}
                placeholder="검색어(클릭 시 실행)"
                maxLength={200}
                className="w-full flex-1 rounded-full border border-ink-100 bg-white px-4 py-2 text-sm outline-none"
              />
              <input
                value={draft.sortOrder}
                onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
                placeholder="순서"
                type="number"
                className="w-full rounded-full border border-ink-100 bg-white px-4 py-2 text-sm outline-none sm:w-20"
              />
              <button
                type="button"
                disabled={busy}
                onClick={handleAdd}
                className="shrink-0 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TABS = [
  { id: 'reports', label: '신고함' },
  { id: 'reportHistory', label: '신고 완료 기록' },
  { id: 'inquiries', label: '문의게시판' },
  { id: 'inquiryHistory', label: '문의 완료 기록' },
]

const TITLES = {
  reports: '신고함 — 작성자 제재',
  reportHistory: '신고 완료 기록',
  inquiries: '문의게시판 관리',
  inquiryHistory: '문의 완료 기록',
}

export default function AdminConsolePage() {
  const { isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((item) => item.id === params.get('tab')) ? params.get('tab') : 'reports'

  if (!isAdmin) {
    return <PlaceholderPage title="관리자 콘솔" description="관리자 권한이 필요한 페이지예요." showDemoLogin />
  }

  return (
    <div className="px-6 py-10">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-full bg-ink-900 px-3 py-1.5 text-xs font-bold text-white">🔒 관리자 전용</span>
        <h1 className="text-xl font-bold text-ink-900">{TITLES[tab]}</h1>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setParams(item.id === 'reports' ? {} : { tab: item.id })}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === item.id ? 'bg-ink-900 text-white' : 'border border-ink-100 text-ink-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'reports' && <ReportsTab historyOnly={false} />}
      {tab === 'reportHistory' && <ReportsTab historyOnly />}
      {tab === 'inquiries' && <InquiriesTab historyOnly={false} />}
      {tab === 'inquiryHistory' && <InquiriesTab historyOnly />}
    </div>
  )
}
