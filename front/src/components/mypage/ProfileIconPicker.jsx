import { useEffect, useMemo, useState } from 'react'
import * as authApi from '../../api/auth'
import { DEFAULT_PROFILE_ICONS, PROFILE_ICON_GROUP_ORDER } from '../../data/defaultProfileIcons'

export default function ProfileIconPicker({ selectedId, onSaved, onCancel, variant = 'inline' }) {
  const [icons, setIcons] = useState(DEFAULT_PROFILE_ICONS)
  const [loading, setLoading] = useState(true)
  const [picked, setPicked] = useState(selectedId ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setPicked(selectedId ?? '')
  }, [selectedId])

  useEffect(() => {
    let cancelled = false
    authApi
      .listProfileIcons()
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data) && data.length) setIcons(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? '목록을 서버에서 못 불러와 기본 아이콘을 보여요.')
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
    const ordered = PROFILE_ICON_GROUP_ORDER.filter((key) => byGroup.has(key))
    const extra = [...byGroup.keys()].filter((key) => !PROFILE_ICON_GROUP_ORDER.includes(key))
    return [...ordered, ...extra].map((key) => [key, byGroup.get(key)])
  }, [icons])

  async function handleSave() {
    if (!picked) return
    setSaving(true)
    setError('')
    try {
      const me = await authApi.updateProfileIcon(picked)
      onSaved?.(me)
    } catch (err) {
      setError(err.message ?? '아이콘을 저장하지 못했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p className="mb-4 text-xs text-ink-500">웹툰 장르·향에 맞는 쿼카 아이콘을 골라 프로필에 쓸 수 있어요.</p>

      {loading && icons.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-500">불러오는 중…</p>
      ) : (
        <div className={variant === 'modal' ? 'max-h-[60vh] space-y-5 overflow-y-auto p-1' : 'space-y-5 p-1'}>
          {groups.map(([key, group]) => (
            <section key={key}>
              <h3 className="mb-2 text-xs font-bold tracking-wide text-ink-500">{group.label}</h3>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {group.items.map((icon) => {
                  const active = picked === icon.id
                  return (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setPicked(icon.id)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center transition ${
                        active
                          ? 'border-ink-900 bg-ink-50'
                          : 'border-ink-100 hover:bg-ink-50'
                      }`}
                    >
                      <img
                        src={icon.imageUrl}
                        alt={icon.label}
                        className="h-16 w-16 rounded-full object-cover"
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
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-ink-100 px-4 py-2 text-xs font-semibold text-ink-500 hover:bg-ink-50"
          >
            취소
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!picked || saving || picked === selectedId}
          className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-50"
        >
          {saving ? '저장 중…' : '이 아이콘 사용'}
        </button>
      </div>
    </div>
  )
}
