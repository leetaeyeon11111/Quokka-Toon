export default function ProfileAvatar({
  src,
  sizeClass = 'h-16 w-16',
  emojiClass = 'text-2xl',
  alt = '',
  className = '',
}) {
  const box = `${sizeClass} block shrink-0 overflow-hidden rounded-full bg-ink-50 ${className}`
  if (src) {
    return <img src={src} alt={alt} className={`${box} object-cover`} />
  }
  return (
    <div className={`${box} flex items-center justify-center ${emojiClass}`} aria-hidden={!alt}>
      🐿
    </div>
  )
}
