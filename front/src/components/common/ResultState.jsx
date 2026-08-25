export function ResultGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-label="목록을 불러오는 중" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse motion-reduce:animate-none">
          <div className="aspect-[3/4] rounded-xl bg-ink-100" />
          <div className="mt-3 h-3 w-4/5 rounded bg-ink-100" />
          <div className="mt-2 h-2.5 w-2/5 rounded bg-ink-100" />
        </div>
      ))}
    </div>
  )
}

const ERROR_QUOKKA = '/error_quokka.png'

export function ResultMessage({
  icon = '🐿',
  imageSrc,
  imageAlt = '',
  tone = 'default',
  title,
  description,
  actionLabel,
  onAction,
}) {
  const illustration = imageSrc ?? (tone === 'error' ? ERROR_QUOKKA : null)

  return (
    <div className="flex flex-col items-center rounded-3xl border border-ink-100 bg-white px-6 py-16 text-center shadow-sm">
      {illustration ? (
        <img
          src={illustration}
          alt={imageAlt}
          aria-hidden={!imageAlt}
          className="mb-1 h-36 w-36 object-contain sm:h-44 sm:w-44"
        />
      ) : (
        <span className="text-4xl" aria-hidden>
          {icon}
        </span>
      )}
      <h2 className="mt-4 text-lg font-bold text-ink-900">{title}</h2>
      {description && <p className="mt-2 max-w-lg text-sm leading-6 text-ink-500">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
