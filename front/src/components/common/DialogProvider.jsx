import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DialogContext } from '../../context/dialog-context'
import Modal from './Modal'

function normalizeOptions(options, defaults) {
  if (typeof options === 'string') return { ...defaults, message: options }
  return { ...defaults, ...options }
}

export default function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolveRef = useRef(null)

  const open = useCallback((nextDialog) => new Promise((resolve) => {
    resolveRef.current?.(false)
    resolveRef.current = resolve
    setDialog(nextDialog)
  }), [])

  const showAlert = useCallback((options) => open(normalizeOptions(options, {
    type: 'alert',
    title: '알림',
    confirmLabel: '확인',
  })), [open])

  const showConfirm = useCallback((options) => open(normalizeOptions(options, {
    type: 'confirm',
    title: '한 번 더 확인해주세요',
    confirmLabel: '확인',
    cancelLabel: '취소',
    tone: 'danger',
  })), [open])

  const settle = useCallback((result) => {
    const resolve = resolveRef.current
    resolveRef.current = null
    setDialog(null)
    resolve?.(result)
  }, [])

  useEffect(() => () => resolveRef.current?.(false), [])

  const value = useMemo(() => ({
    alert: showAlert,
    confirm: showConfirm,
  }), [showAlert, showConfirm])

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog && (
        <Modal
          title={dialog.title}
          icon={dialog.icon}
          onClose={() => settle(dialog.type === 'alert')}
        >
          <p className="whitespace-pre-wrap text-sm leading-6 text-ink-700">{dialog.message}</p>
          <div className="mt-6 flex gap-2">
            {dialog.type === 'confirm' && (
              <button
                type="button"
                onClick={() => settle(false)}
                className="flex-1 rounded-full border border-ink-100 py-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
              >
                {dialog.cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => settle(true)}
              className={`flex-1 rounded-full py-3 text-sm font-semibold text-white transition ${
                dialog.tone === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-ink-900 hover:bg-ink-700'
              }`}
            >
              {dialog.confirmLabel}
            </button>
          </div>
        </Modal>
      )}
    </DialogContext.Provider>
  )
}
