import { useEffect, useMemo, useState } from 'react'
import Modal from '../common/Modal'
import * as authApi from '../../api/auth'

const GROUP_ORDER = ['GENRE', 'FEMALE', 'MALE']

export default function ProfileIconPickerModal({ selectedId, onClose, onSaved }) {
  const [icons, setIcons] = useState([])
  const [loading, setLoading] = useState(true)
  const [picked, setPicked] = useState(selectedId ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    authApi
      .listProfileIcons()
      .then((data) => {
        if (!cancelled) setIcons(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? '아이콘 목록을 불러오지 못했어요.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const groups = useMemo(() => {
    const byGroup = new Map()
    for (const icon of icons) {
      const key = icon.group || 'GENRE'
      if (!byGroup.has(key)) {
        byGroup.set(key, { label: icon.groupLabel || key, items: [] })
      }
      byGroup.get(key).items.push(icon)
    }
    return GROUP_ORDER.filter((key) => byGroup.has(key)).map((key) => [key, byGroup.get(key)])
  }, [icons])

  async function handleSave() {
    if (!picked) return
    setSaving(true)
    setError('')
    try {
      const me = await authApi.updateProfileIcon(picked)
      onSaved?.(me)
      onClose()
    } catch (err) {
      setError(err.message ?? '아이콘을 저장하지 못했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="기본 제공 아이콘" icon="🎨" onClose={onClose} maxWidth="max-w-2xl">
      <p className="mb-4 text-xs text-ink-500">웹툰 장르·향에 맞는 쿼카 아이콘을 골라 프로필에 쓸 수 있어요.</p>

      {loading ? (
        <p className="py-8 text-center text-sm text-ink-500">불러오는 중…</p>
      ) : (
        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          {groups.map(([key, group]) => (
            <section key={key}>
              <h3 className="mb-2 text-xs font-bold tracking-wide text-ink-500">{group.label}</h3>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {group.items.map((icon) => {
                  const active = picked === icon.id
                  return (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setPicked(icon.id)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border p-2 text-center transition ${
                        active
                          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-400'
                          : 'border-ink-100 hover:bg-ink-50'
                      }`}
                    >
                      <img
                        src={icon.imageUrl}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover"
                      />
                      <span className="text-[11px] font-semibold text-ink-700">{icon.label}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-ink-100 px-4 py-2 text-xs font-semibold text-ink-500 hover:bg-ink-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!picked || saving || loading}
          className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-50"
        >
          {saving ? '저장 중…' : '이 아이콘 사용'}
        </button>
      </div>
    </Modal>
  )
}
