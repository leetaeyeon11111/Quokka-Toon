import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import PlaceholderPage from '../../components/common/PlaceholderPage'

function EditableRow({ label, value, locked, onSave, mask }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  return (
    <div className="flex items-center justify-between border-b border-ink-100 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold text-ink-500">{label}</p>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full max-w-xs rounded-full border border-ink-100 bg-ink-50 px-3 py-1.5 text-sm outline-none"
          />
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
            onClick={() => {
              onSave(draft)
              setEditing(false)
            }}
            className="rounded-full bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(value)
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
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-full border border-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
        >
          수정
        </button>
      )}
    </div>
  )
}

export default function InfoPage() {
  const { user, login } = useAuth()

  if (!user) {
    return (
      <PlaceholderPage title="내 정보 관리" description="로그인 후 이용할 수 있어요." showDemoLogin />
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-50 text-2xl">
          🐿
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-ink-900">{user.nickname}</p>
          <p className="text-xs text-ink-500">
            Lv.{user.level} · 경험치 {user.exp}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('프로필 사진 변경은 다음 업데이트에서 지원돼요.')}
          className="shrink-0 rounded-full border border-ink-100 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
        >
          프로필 사진 변경
        </button>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white px-5">
        <p className="pt-4 text-sm font-bold text-ink-900">계정 관리</p>
        <EditableRow
          label="닉네임"
          value={user.nickname}
          onSave={(v) => login({ ...user, nickname: v })}
        />
        <EditableRow label="비밀번호" value="password123" mask onSave={() => {}} />
        <EditableRow label="이메일 (아이디)" value={user.email ?? 'name@email.com'} locked />
        <EditableRow
          label="성별 / 나이"
          value={`${user.gender ?? '여'} · ${user.age ? `${user.age}세` : '1998'}`}
          locked
        />
      </div>
    </div>
  )
}
