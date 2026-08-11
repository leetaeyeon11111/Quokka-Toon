const TAG_ICONS = {
  로맨틱코메디: '💕',
  애증의재회: '🔥',
  비즈니스복수: '💼',
  복수: '🗡️',
  액션: '⚔️',
  개그: '😂',
  힐링: '🌿',
  일상: '☀️',
  헌터물: '🏹',
  먼치킨: '💪',
  판타지: '🐉',
  드라마: '🎭',
  오컬트: '🔮',
  성장물: '🌱',
  무협: '🈲',
  트라우마: '💔',
}

export default function Tag({ name, size = 'md', className = '' }) {
  const icon = TAG_ICONS[name]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-ink-100 bg-ink-50 text-ink-700 whitespace-nowrap ${sizeClass} ${className}`}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}#{name}
    </span>
  )
}
