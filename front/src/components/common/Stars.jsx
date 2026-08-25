export function StarsDisplay({ rating, size = 'text-sm' }) {
  const full = Math.round(rating)
  return (
    <span className={`text-brand-500 ${size}`} aria-label={`평점 ${rating}점`}>
      {'★'.repeat(full)}
      {'☆'.repeat(5 - full)}
    </span>
  )
}

export function StarsInput({ value, onChange }) {
  return (
    <span className="inline-flex shrink-0 items-center text-lg text-brand-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}점`}
          onClick={() => onChange(n)}
          className="cursor-pointer leading-none"
        >
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </span>
  )
}
