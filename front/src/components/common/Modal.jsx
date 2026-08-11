export default function Modal({ title, icon, onClose, children, maxWidth = 'max-w-md' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} rounded-2xl border border-ink-100 bg-white p-6 shadow-xl`}
      >
        {(title || onClose) && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-base font-bold text-ink-900">
              {icon && <span aria-hidden>{icon}</span>}
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="text-ink-300 hover:text-ink-700"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
