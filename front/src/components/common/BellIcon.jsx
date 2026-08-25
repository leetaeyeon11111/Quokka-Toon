/** 알림(알람) 종 아이콘 — 이모지 대신 SVG 사용. */
export default function BellIcon({ filled = false, className = 'h-6 w-6' }) {
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
      {filled ? (
        <>
          <path d="M12 3a6.5 6.5 0 0 0-6.5 6.5V14l-1.4 2.1A1 1 0 0 0 5 17.5h14a1 1 0 0 0 .9-1.4L18.5 14V9.5A6.5 6.5 0 0 0 12 3Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </>
      ) : (
        <>
          <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0V14l1.6 2.4a.75.75 0 0 1-.65 1.15H5.55a.75.75 0 0 1-.65-1.15L6.5 14V9.5Z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </>
      )}
    </svg>
  )
}
