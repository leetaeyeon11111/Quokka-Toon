import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import * as adminReqApi from '../../api/adminRequest'
import * as authApi from '../../api/auth'
import PlaceholderPage from '../../components/common/PlaceholderPage'
import ProfileAvatar from '../../components/common/ProfileAvatar'
import ProfileIconPicker from '../../components/mypage/ProfileIconPicker'
import { levelLabel, nicknameLevelClass } from '../../lib/level'
import { useDialog } from '../../hooks/useDialog'

function EditableRow({ label, value, locked, onSave, mask, maxLength, hint, checkAvailability }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [availability, setAvailability] = useState('idle') // idle | checking | available | taken
  const checkTimerRef = useRef(null)

  // 실시간 중복 확인: 입력 이벤트에서 디바운스(400ms)로 checkAvailability 호출.
  function runAvailabilityCheck(rawValue) {
    if (!checkAvailability) return
    const next = String(rawValue ?? '').trim()
    clearTimeout(checkTimerRef.current)
    if (!next || next === value || (maxLength && next.length > maxLength)) {
      setAvailability('idle')
      return
    }
    setAvailability('checking')
    checkTimerRef.current = setTimeout(async () => {
      try {
        const { available } = await checkAvailability(next)
        setAvailability(available ? 'available' : 'taken')
      } catch {
        setAvailability('idle')
      }
    }, 400)
  }

  async function handleSave() {
    const next = String(draft ?? '').trim()
    if (!next) {
      setError(`${label}을 입력해주세요.`)
      return
    }
    if (maxLength && next.length > maxLength) {
      setError(`${label}은 최대 ${maxLength}자예요.`)
      return
    }
    if (next === value) {
      setEditing(false)
      setError('')
      return
    }
    if (checkAvailability && availability === 'taken') {
      setError(`이미 사용 중인 ${label}이에요.`)
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(next)
      setEditing(false)
    } catch (err) {
      setError(err.message ?? '저장에 실패했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-ink-100 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold text-ink-500">{label}</p>
        {editing ? (
          <>
            <input
              autoFocus
              value={draft}
              maxLength={maxLength}
              onChange={(e) => {
                const next = maxLength ? e.target.value.slice(0, maxLength) : e.target.value
                setDraft(next)
                setError('')
                runAvailabilityCheck(next)
              }}
              className="w-full max-w-xs rounded-full border border-ink-100 bg-ink-50 px-3 py-1.5 text-sm outline-none"
            />
            {hint && <p className="mt-1 text-xs text-ink-300">{hint}</p>}
            {checkAvailability && availability === 'checking' && (
              <p className="mt-1 text-xs text-ink-400">중복 확인 중…</p>
            )}
            {checkAvailability && availability === 'available' && (
              <p className="mt-1 text-xs text-mint-500">사용 가능한 {label}이에요.</p>
            )}
            {checkAvailability && availability === 'taken' && (
              <p className="mt-1 text-xs text-red-500">이미 사용 중인 {label}이에요.</p>
            )}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </>
        ) : (
          <p className="text-sm font-semibold text-ink-900">{mask ? '•'.repeat(8) : value}</p>
        )}
      </div>
      {locked ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-ink-50 px-3 py-1.5 text-xs text-ink-300">
          🔒 변경 불가
        </span>
      ) : editing ? (
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            disabled={saving || (checkAvailability && (availability === 'checking' || availability === 'taken'))}
            onClick={handleSave}
            className="rounded-full bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setDraft(value)
              setError('')
              setAvailability('idle')
              setEditing(false)
            }}
            className="rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-500"
          >
            취소
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(value)
            setError('')
            setAvailability('idle')
            setEditing(true)
          }}
          className="shrink-0 rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
        >
          수정
        </button>
      )}
    </div>
  )
}

const GENDER_LABEL = { M: '남', F: '여', NONE: '미설정' }

function calcAge(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
}

// 일반 유저: 관리자 승격 요청
function AdminRequestSection() {
  const { alert: showAlert } = useDialog()
  const [status, setStatus] = useState(undefined) // undefined=로딩, null=요청없음, 'PENDING'/'APPROVED'/'REJECTED'
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    adminReqApi
      .getMyAdminRequest()
      .then((r) => setStatus(r?.status ?? null))
      .catch(() => setStatus(null))
  }, [])

  async function handleRequest() {
    setSubmitting(true)
    try {
      await adminReqApi.requestAdmin()
      setStatus('PENDING')
    } catch (err) {
      showAlert(err.message ?? '요청에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
      <p className="mb-1 text-sm font-bold text-ink-900">관리자 권한</p>
      <p className="mb-3 text-xs text-ink-500">
        관리자에게 승격을 요청할 수 있어요. 승인되면 신고·문의 관리 기능을 사용할 수 있습니다.
      </p>

      {status === 'PENDING' ? (
        <span className="inline-block rounded-full bg-ink-100 px-4 py-2 text-xs font-semibold text-ink-500">
          ⏳ 승인 대기중
        </span>
      ) : status === 'APPROVED' ? (
        <span className="inline-block rounded-full bg-mint-100 px-4 py-2 text-xs font-semibold text-mint-500">
          ✅ 승인됨 — 다시 로그인하면 관리자 기능을 쓸 수 있어요.
        </span>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRequest}
            disabled={submitting || status === undefined}
            className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink-700 disabled:opacity-50"
          >
            {submitting ? '요청 중…' : '관리자 요청하기'}
          </button>
          {status === 'REJECTED' && (
            <span className="text-xs text-red-500">이전 요청이 거절됐어요. 다시 요청할 수 있어요.</span>
          )}
        </div>
      )}
    </div>
  )
}

// 관리자: 승격 요청 목록 + 승인/거절
function AdminApprovalSection() {
  const { alert: showAlert } = useDialog()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminReqApi
      .listAdminRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }, [])

  async function handle(id, approve) {
    try {
      if (approve) await adminReqApi.approveAdminRequest(id)
      else await adminReqApi.rejectAdminRequest(id)
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      showAlert(err.message ?? '처리에 실패했어요.')
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
      <p className="mb-3 text-sm font-bold text-ink-900">
        🛡 관리자 승격 요청 <span className="text-ink-300">{requests.length}건</span>
      </p>

      {loading ? (
        <p className="py-6 text-center text-sm text-ink-500">불러오는 중…</p>
      ) : requests.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-500">대기 중인 요청이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">
                  <span className={nicknameLevelClass(r.level)}>{r.nickname}</span>{' '}
                  <span className="text-xs font-normal text-ink-300">Lv.{r.level}</span>
                </p>
                <p className="truncate text-xs text-ink-500">{r.email}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => handle(r.id, true)}
                  className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
                >
                  승인
                </button>
                <button
                  type="button"
                  onClick={() => handle(r.id, false)}
                  className="rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-ink-50"
                >
                  거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 관리자: 현재 관리자 목록 + 해제(강등)
function AdminListSection() {
  const { user } = useAuth()
  const { alert: showAlert, confirm: showConfirm } = useDialog()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminReqApi
      .listAdmins()
      .then(setAdmins)
      .catch(() => setAdmins([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleRevoke(userId) {
    const confirmed = await showConfirm({
      title: '관리자 권한 해제',
      message: '이 사용자의 관리자 권한을 해제할까요?',
      confirmLabel: '권한 해제',
    })
    if (!confirmed) return
    try {
      await adminReqApi.revokeAdmin(userId)
      setAdmins((prev) => prev.filter((a) => a.userId !== userId))
    } catch (err) {
      showAlert(err.message ?? '해제에 실패했어요.')
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
      <p className="mb-3 text-sm font-bold text-ink-900">
        👑 현재 관리자 <span className="text-ink-300">{admins.length}명</span>
      </p>

      {loading ? (
        <p className="py-6 text-center text-sm text-ink-500">불러오는 중…</p>
      ) : admins.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-500">관리자가 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {admins.map((a) => {
            const isMe = a.userId === user?.userId
            return (
              <div
                key={a.userId}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">
                    <span className={nicknameLevelClass(a.level)}>{a.nickname}</span>
                    {isMe && <span className="ml-1 text-xs font-normal text-brand-500">(나)</span>}
                    <span className="ml-1 text-xs font-normal text-ink-300">Lv.{a.level}</span>
                  </p>
                  <p className="truncate text-xs text-ink-500">{a.email}</p>
                </div>
                {isMe ? (
                  <span className="shrink-0 rounded-full bg-ink-50 px-3 py-1.5 text-xs text-ink-300">
                    본인
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevoke(a.userId)}
                    className="shrink-0 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                  >
                    관리자 해제
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-ink-300">
        * 해제된 사용자는 다시 로그인하면 일반 회원으로 돌아갑니다.
      </p>
    </div>
  )
}

export default function InfoPage() {
  const { user, isAdmin, refresh } = useAuth()
  const [showIconModal, setShowIconModal] = useState(false)

  if (!user) {
    return (
      <PlaceholderPage title="내 정보 관리" description="로그인 후 이용할 수 있어요." showDemoLogin />
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center gap-4">
        <ProfileAvatar src={user.profileImageUrl} alt={`${user.nickname} 프로필`} />
        <div className="flex-1">
          <p className={`text-base font-bold ${nicknameLevelClass(user.level)}`}>{user.nickname}</p>
          <p className="text-xs text-ink-500">
            {levelLabel(user)} · 누적 {user.exp} EXP · 오늘 EXP {user.todayExp ?? 0}/{user.dailyExpCap ?? 20}
          </p>
          <div
            className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-ink-100"
            role="progressbar"
            aria-label={`${levelLabel(user)} 진행률`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={user.progressPercent ?? 0}
          >
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${user.progressPercent ?? 0}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowIconModal(true)}
          className="shrink-0 rounded-full border border-ink-100 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
        >
          프로필 수정하기
        </button>
      </div>

      {showIconModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowIconModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-base font-bold text-ink-900">프로필 아이콘 선택</p>
            <ProfileIconPicker
              selectedId={user.profileIconId}
              variant="modal"
              onCancel={() => setShowIconModal(false)}
              onSaved={() => {
                refresh()
                setShowIconModal(false)
              }}
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-ink-100 bg-white px-5">
        <p className="pt-4 text-sm font-bold text-ink-900">계정 관리</p>
        <EditableRow
          label="닉네임"
          value={user.nickname}
          maxLength={6}
          hint="최대 6글자"
          checkAvailability={authApi.checkNickname}
          onSave={async (nickname) => {
            await authApi.updateNickname(nickname)
            await refresh()
          }}
        />
        <EditableRow label="이메일 (아이디)" value={user.email ?? '-'} locked />
        <EditableRow
          label="성별 / 나이"
          value={`${GENDER_LABEL[user.gender] ?? '미설정'}${
            calcAge(user.birthDate) != null ? ` · ${calcAge(user.birthDate)}세` : ''
          }`}
          locked
        />
      </div>

      {isAdmin ? (
        <>
          <AdminApprovalSection />
          <AdminListSection />
        </>
      ) : (
        <AdminRequestSection />
      )}
    </div>
  )
}
