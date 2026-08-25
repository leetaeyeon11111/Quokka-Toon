import { useState } from 'react'
import { platformLogoClip, resolvePlatformLogoUrl } from '../../lib/platformLogos'

const SIZE_CLASS = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-8 w-8',
}

/**
 * 플랫폼 로고. 각 웹툰 사이트 아이콘(/platform-logos/*) 사용.
 * DB logo_url 우선, 없거나 옛 글자 SVG면 이름 매핑으로 폴백.
 */
export default function PlatformLogo({
  name,
  logoUrl,
  size = 'md',
  className = '',
  showNameFallback = true,
}) {
  const [failed, setFailed] = useState(false)
  const resolved = resolvePlatformLogoUrl(name, logoUrl)
  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md
  const clipClass = platformLogoClip(name) === 'circle' ? 'rounded-full' : 'rounded-md'

  if (resolved && !failed) {
    return (
      <img
        src={resolved}
        alt={name ? `${name} 로고` : '플랫폼 로고'}
        title={name || undefined}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${sizeClass} shrink-0 object-contain ${clipClass} ${className}`}
      />
    )
  }

  if (!showNameFallback || !name) return null

  return (
    <span
      title={name}
      className={`inline-flex max-w-[5.5rem] shrink-0 items-center truncate rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600 ${className}`}
    >
      {name}
    </span>
  )
}
