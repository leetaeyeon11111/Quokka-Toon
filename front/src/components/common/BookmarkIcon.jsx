/** 평점 ★와 구분되는 북마크 아이콘 (채움/외곽선). */
export default function BookmarkIcon({ filled = false, className = 'h-6 w-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3.75h12A1.25 1.25 0 0 1 19.25 5v15.1a.75.75 0 0 1-1.2.6L12 16.25 5.95 20.7a.75.75 0 0 1-1.2-.6V5A1.25 1.25 0 0 1 6 3.75Z" />
    </svg>
  )
}
