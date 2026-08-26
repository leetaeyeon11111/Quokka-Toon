import { Link } from 'react-router-dom'
import ProfileAvatar from '../components/common/ProfileAvatar'
import { nicknameLevelClass } from '../lib/level'

const SAMPLE_AVATAR = '/avatars/quokka-ip-a1-fantasy.png'
const SAMPLE_NICK = '봄감자덕후'
const SAMPLE_LEVEL = 3

/**
 * 헤더 프로필 칩 크기 시안.
 * 경로: /dev/header-profile
 *
 * 로고(아바타)만 키우지 않고, 둘러싼 pill·패딩·글자 크기를 같이 맞춤.
 */
const VARIANTS = [
  {
    id: 'A',
    label: 'A · 현재',
    note: 'h-5 (20px) · text 11px / sm 12px',
    avatar: 'h-5 w-5',
    emoji: 'text-[10px]',
    gap: 'gap-1',
    pad: 'px-2 py-1.5 sm:px-3',
    text: 'text-[11px] sm:text-xs',
    maxW: 'max-w-30 sm:max-w-44',
  },
  {
    id: 'B',
    label: 'B · +2px',
    note: 'h-6 (24px) · text 12px',
    avatar: 'h-6 w-6',
    emoji: 'text-xs',
    gap: 'gap-1.5',
    pad: 'px-2.5 py-1.5 sm:px-3',
    text: 'text-xs',
    maxW: 'max-w-36 sm:max-w-48',
  },
  {
    id: 'C',
    label: 'C · +4px',
    note: 'h-7 (28px) · text 12px / sm 13px',
    avatar: 'h-7 w-7',
    emoji: 'text-sm',
    gap: 'gap-1.5',
    pad: 'px-2.5 py-1.5 sm:px-3.5',
    text: 'text-xs sm:text-[13px]',
    maxW: 'max-w-40 sm:max-w-52',
  },
  {
    id: 'D',
    label: 'D · +8px',
    note: 'h-8 (32px) · text 13px',
    avatar: 'h-8 w-8',
    emoji: 'text-sm',
    gap: 'gap-2',
    pad: 'px-3 py-1.5 sm:px-3.5',
    text: 'text-[13px]',
    maxW: 'max-w-44 sm:max-w-56',
  },
  {
    id: 'E',
    label: 'E · +12px',
    note: 'h-9 (36px) · text 14px',
    avatar: 'h-9 w-9',
    emoji: 'text-base',
    gap: 'gap-2',
    pad: 'px-3 py-2 sm:px-4',
    text: 'text-sm',
    maxW: 'max-w-48 sm:max-w-60',
  },
  {
    id: 'F',
    label: 'F · +16px',
    note: 'h-10 (40px) · text 14px · 헤더 높이에 거의 맞춤',
    avatar: 'h-10 w-10',
    emoji: 'text-base',
    gap: 'gap-2.5',
    pad: 'px-3.5 py-2 sm:px-4',
    text: 'text-sm',
    maxW: 'max-w-52 sm:max-w-64',
  },
]

function ProfileChip({ variant, src = SAMPLE_AVATAR, nick = SAMPLE_NICK, level = SAMPLE_LEVEL }) {
  return (
    <span
      className={`inline-flex min-w-0 items-center rounded-full border border-ink-100 bg-white font-semibold text-ink-700 ${variant.gap} ${variant.pad} ${variant.text} ${variant.maxW}`}
    >
      <ProfileAvatar
        src={src}
        alt=""
        sizeClass={variant.avatar}
        emojiClass={variant.emoji}
      />
      <span className="shrink-0">Lv.{level} ·</span>
      <span className={`min-w-0 truncate ${nicknameLevelClass(level)}`}>{nick}</span>
    </span>
  )
}

function MiniHeader({ variant }) {
  return (
    <div className="flex h-14 items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white px-3 shadow-sm sm:px-5">
      <img src="/quokkatoon_logo.png" alt="" className="h-10 w-auto object-contain opacity-90" />
      <nav className="hidden items-center gap-5 text-xs font-semibold text-ink-500 md:flex">
        <span>웹툰</span>
        <span>AI 추천</span>
        <span>게시판</span>
      </nav>
      <div className="flex min-w-0 items-center gap-2">
        <ProfileChip variant={variant} />
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-100 text-ink-400"
          aria-hidden
        >
          ⌕
        </span>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-100 text-ink-400"
          aria-hidden
        >
          ≡
        </span>
      </div>
    </div>
  )
}

export default function HeaderProfileMockPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Design mock</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">헤더 프로필 로고 크기 시안</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
          현재 헤더 칩은 아바타 <code className="rounded bg-ink-50 px-1">h-5</code>(20px)라
          분간이 어렵습니다. 아래는 로고만 키운 게 아니라{' '}
          <strong className="font-semibold text-ink-700">pill 패딩 · gap · 글자 크기</strong>를
          같이 맞춘 단계별 시안입니다.
        </p>
        <p className="mt-1 text-[11px] text-ink-300">/dev/header-profile</p>
      </div>

      <section className="mb-10 rounded-2xl border border-ink-100 bg-ink-50/60 p-4 sm:p-5">
        <p className="mb-3 text-xs font-bold text-ink-700">나란히 비교 (실제 칩만)</p>
        <div className="flex flex-wrap items-end gap-3">
          {VARIANTS.map((v) => (
            <div key={v.id} className="flex flex-col items-start gap-1.5">
              <span className="text-[10px] font-semibold text-ink-400">{v.id}</span>
              <ProfileChip variant={v} />
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
                {v.avatar} · {v.text}
              </code>
            </div>
            <MiniHeader variant={v} />
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div>
                <p className="mb-1 text-[10px] font-semibold text-ink-300">긴 닉네임 truncate</p>
                <ProfileChip
                  variant={v}
                  nick="슈퍼칼리가지리스틱엑스피알리도셔스닉네임"
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold text-ink-300">기본 아이콘(미설정)</p>
                <ProfileChip variant={v} src={null} nick="새싹유저" level={1} />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold text-ink-300">다른 아바타</p>
                <ProfileChip
                  variant={v}
                  src="/avatars/quokka-ip-b4-villainess.png"
                  nick="악녀덕후"
                  level={5}
                />
              </div>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-ink-300">
        다른 시안{' '}
        <Link to="/dev/header-logo" className="underline hover:text-ink-500">
          /dev/header-logo
        </Link>
        {' · '}
        <Link to="/dev/media-mix-buttons" className="underline hover:text-ink-500">
          /dev/media-mix-buttons
        </Link>
        {' · '}
        <Link to="/dev/ai-summary-mark" className="underline hover:text-ink-500">
          /dev/ai-summary-mark
        </Link>
      </p>
    </div>
  )
}
