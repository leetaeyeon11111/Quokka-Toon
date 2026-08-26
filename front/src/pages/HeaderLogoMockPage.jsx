import { Link } from 'react-router-dom'
import ProfileAvatar from '../components/common/ProfileAvatar'

/**
 * 헤더 사이트 로고 크기 시안.
 * 경로: /dev/header-logo
 *
 * 헤더 바 높이(--site-header-height = 4rem)는 고정.
 * 로고(img) 높이만 점진적으로 키움.
 */
const HEADER_H = 'h-[var(--site-header-height)]' // 4rem = 64px

const VARIANTS = [
  {
    id: 'A',
    label: 'A · 현재',
    note: 'h-14 (56px) · 헤더 64px 안 여유 4px씩',
    logoClass: 'h-14 w-auto object-contain',
  },
  {
    id: 'B',
    label: 'B · +2px',
    note: 'h-[58px]',
    logoClass: 'h-[58px] w-auto object-contain',
  },
  {
    id: 'C',
    label: 'C · +4px',
    note: 'h-[60px]',
    logoClass: 'h-[60px] w-auto object-contain',
  },
  {
    id: 'D',
    label: 'D · +6px',
    note: 'h-[62px]',
    logoClass: 'h-[62px] w-auto object-contain',
  },
  {
    id: 'E',
    label: 'E · 헤더 풀 높이',
    note: 'h-16 (64px) · 헤더 행 높이와 동일',
    logoClass: 'h-16 w-auto object-contain',
  },
  {
    id: 'F',
    label: 'F · 살짝 넘침 + clip',
    note: 'h-[72px] · 헤더는 overflow-hidden으로 잘라 더 크게 보이게',
    logoClass: 'h-[72px] w-auto object-contain',
    clip: true,
  },
  {
    id: 'G',
    label: 'G · scale 1.12 + clip',
    note: 'h-14 유지 + scale(1.12) · PNG 여백 보정용',
    logoClass: 'h-14 w-auto origin-left object-contain scale-[1.12]',
    clip: true,
  },
  {
    id: 'H',
    label: 'H · scale 1.2 + clip',
    note: 'h-14 유지 + scale(1.2) · 더 또렷한 브랜드 신호',
    logoClass: 'h-14 w-auto origin-left object-contain scale-[1.2]',
    clip: true,
  },
]

function FakeChrome() {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <span className="hidden items-center gap-1 rounded-full border border-ink-100 px-2.5 py-1.5 text-[11px] font-semibold text-ink-600 sm:inline-flex">
        <ProfileAvatar
          src="/avatars/quokka-ip-a1-fantasy.png"
          alt=""
          sizeClass="h-5 w-5"
          emojiClass="text-[10px]"
        />
        Lv.3 · 봄감자
      </span>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-100 text-ink-400"
        aria-hidden
      >
        ⌕
      </span>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-100 text-ink-400"
        aria-hidden
      >
        ≡
      </span>
    </div>
  )
}

function MiniHeader({ variant, showGuides = true }) {
  return (
    <div
      className={`relative flex ${HEADER_H} w-full items-center justify-between border border-ink-100 bg-white px-3 sm:px-6 ${
        variant.clip ? 'overflow-hidden' : 'overflow-visible'
      }`}
    >
      {showGuides && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 border-t border-dashed border-brand-300/70"
            title="헤더 상단"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 border-b border-dashed border-brand-300/70"
            title="헤더 하단"
          />
        </>
      )}
      <div className="relative flex min-w-0 items-center">
        <img src="/quokkatoon_logo.png" alt="쿼카툰" className={variant.logoClass} />
      </div>
      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-xs font-semibold text-ink-500 md:flex">
        <span>웹툰</span>
        <span>AI 추천 검색</span>
        <span>게시판</span>
      </nav>
      <FakeChrome />
    </div>
  )
}

export default function HeaderLogoMockPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Design mock</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">헤더 사이트 로고 크기 시안</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
          헤더 바 높이는{' '}
          <code className="rounded bg-ink-50 px-1">--site-header-height: 4rem (64px)</code>로
          고정합니다. 로고만 조금씩 키운 안과, PNG 여백 때문에 작아 보일 때를 위한{' '}
          <strong className="font-semibold text-ink-700">scale + clip</strong> 안을 같이
          비교합니다. 점선은 헤더 상·하단 경계입니다.
        </p>
        <p className="mt-1 text-[11px] text-ink-300">/dev/header-logo</p>
      </div>

      <section className="mb-10 rounded-2xl border border-ink-100 bg-ink-50/60 p-4 sm:p-5">
        <p className="mb-1 text-xs font-bold text-ink-700">나란히 비교 (로고만 · 기준선 동일)</p>
        <p className="mb-3 text-[11px] text-ink-400">
          회색 막대 높이가 헤더 64px. 로고는 그 안에서만 커집니다.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          {VARIANTS.map((v) => (
            <div key={v.id} className="flex flex-col items-start gap-1.5">
              <span className="text-[10px] font-semibold text-ink-400">{v.id}</span>
              <div
                className={`flex ${HEADER_H} items-center rounded-lg border border-ink-100 bg-white px-2 ${
                  v.clip ? 'overflow-hidden' : ''
                }`}
              >
                <img src="/quokkatoon_logo.png" alt="" className={v.logoClass} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-8">
        {VARIANTS.map((v) => (
          <section key={v.id} className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-ink-900">{v.label}</h2>
                <p className="text-xs text-ink-400">{v.note}</p>
              </div>
              <code className="rounded-md bg-ink-50 px-2 py-1 text-[10px] text-ink-500">
                {v.logoClass}
              </code>
            </div>
            <MiniHeader variant={v} />
            <p className="mt-2 text-[10px] text-ink-300">
              헤더 높이 고정 64px{v.clip ? ' · overflow-hidden' : ' · overflow-visible'}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-ink-300">
        관련 시안{' '}
        <Link to="/dev/header-profile" className="underline hover:text-ink-500">
          /dev/header-profile
        </Link>
        {' · '}
        <Link to="/dev/media-mix-buttons" className="underline hover:text-ink-500">
          /dev/media-mix-buttons
        </Link>
      </p>
    </div>
  )
}
