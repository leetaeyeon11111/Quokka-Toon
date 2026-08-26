import { Link } from 'react-router-dom'
import PlatformLogo from '../components/webtoon/PlatformLogo'
import {
  NAMU_WIKI_COLOR,
  PLATFORM_COLORS,
  WATCH_SERVICE_COLORS,
  namuWikiButtonStyle,
  platformButtonStyle,
  softBrandStyle,
  watchServiceButtonStyle,
} from '../lib/platformColors'

const SAMPLE_PLATFORMS = [
  '네이버웹툰',
  '카카오웹툰',
  '카카오페이지',
  '레진코믹스',
  '리디북스',
  '봄툰',
]

const SAMPLE_WATCH = ['Disney+', 'Netflix', 'TVING', 'Wavve', '왓챠', '쿠팡플레이']

const VARIANTS = [
  {
    id: 'A',
    title: 'A · 현재 (▶ + 텍스트 + 브랜드색)',
    desc: '상세에 가까운 기본안. 로고 없음.',
  },
  {
    id: 'B',
    title: 'B · 로고 + ▶ + 텍스트 + 브랜드색',
    desc: '플레이 아이콘 옆에 플랫폼/OTT 로고.',
  },
  {
    id: 'C',
    title: 'C · 로고 + 텍스트 (▶ 없음) + 브랜드색',
    desc: '로고가 식별자. 플레이 기호 제거.',
  },
  {
    id: 'D',
    title: 'D · 로고만 (원형·브랜드색)',
    desc: '아이콘 버튼. 호버/타이틀로 이름 확인.',
  },
  {
    id: 'E',
    title: 'E · 로고 + 텍스트 · 연한 틴트',
    desc: '흰 카드 위에서도 덜 튀는 soft fill.',
  },
  {
    id: 'F',
    title: 'F · 아웃라인 + 로고 (흰 배경)',
    desc: '테두리만 브랜드색. 여러 개 나란히일 때 덜 무거움.',
  },
]

function LogoBadge({ name, onDark }) {
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0.5 ${
        onDark ? 'bg-white/95' : 'bg-white'
      }`}
    >
      <PlatformLogo name={name} size="sm" showNameFallback={false} className="!h-full !w-full" />
    </span>
  )
}

/** OTT는 로고 파일이 없어 이니셜 뱃지 */
function ServiceBadge({ label, onDark }) {
  const initial = label.replace('Disney+', 'D+').slice(0, 2)
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
        onDark ? 'bg-white/95 text-ink-800' : 'bg-ink-900 text-white'
      }`}
    >
      {initial}
    </span>
  )
}

function PlatformRow({ variantId }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SAMPLE_PLATFORMS.map((name) => {
        const brand = PLATFORM_COLORS[name] || { bg: '#17a389', fg: '#fff' }
        if (variantId === 'A') {
          return (
            <a
              key={name}
              href="#mock"
              onClick={(e) => e.preventDefault()}
              style={platformButtonStyle(name)}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold"
            >
              ▶ {name}에서 보기
            </a>
          )
        }
        if (variantId === 'B') {
          return (
            <a
              key={name}
              href="#mock"
              onClick={(e) => e.preventDefault()}
              style={platformButtonStyle(name)}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            >
              <LogoBadge name={name} onDark />
              ▶ {name}에서 보기
            </a>
          )
        }
        if (variantId === 'C') {
          return (
            <a
              key={name}
              href="#mock"
              onClick={(e) => e.preventDefault()}
              style={platformButtonStyle(name)}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            >
              <LogoBadge name={name} onDark />
              {name}에서 보기
            </a>
          )
        }
        if (variantId === 'D') {
          return (
            <a
              key={name}
              href="#mock"
              title={`${name}에서 보기`}
              onClick={(e) => e.preventDefault()}
              style={platformButtonStyle(name)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border p-1.5"
            >
              <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-white/95 p-1">
                <PlatformLogo name={name} size="md" showNameFallback={false} className="!h-full !w-full" />
              </span>
            </a>
          )
        }
        if (variantId === 'E') {
          return (
            <a
              key={name}
              href="#mock"
              onClick={(e) => e.preventDefault()}
              style={softBrandStyle(brand.bg, brand.bg)}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            >
              <LogoBadge name={name} />
              {name}에서 보기
            </a>
          )
        }
        // F
        return (
          <a
            key={name}
            href="#mock"
            onClick={(e) => e.preventDefault()}
            style={{ borderColor: brand.bg, color: brand.bg, backgroundColor: '#fff' }}
            className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-semibold"
          >
            <LogoBadge name={name} />
            {name}
          </a>
        )
      })}
    </div>
  )
}

function WatchRow({ variantId }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href="#mock"
        onClick={(e) => e.preventDefault()}
        style={namuWikiButtonStyle()}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
      >
        {variantId !== 'A' && variantId !== 'D' && (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-[10px] font-black text-[#00A495]">
            木
          </span>
        )}
        {variantId === 'A' || variantId === 'B' ? '나무위키에서 미디어믹스 보기' : null}
        {variantId === 'C' || variantId === 'E' || variantId === 'F' ? '나무위키 미디어믹스' : null}
        {variantId === 'D' ? (
          <span className="text-xs font-bold">Namu</span>
        ) : null}
      </a>
      {SAMPLE_WATCH.map((label) => {
        const brand = WATCH_SERVICE_COLORS[label] || { bg: '#17a389', fg: '#fff' }
        if (variantId === 'A') {
          return (
            <a
              key={label}
              href="#mock"
              onClick={(e) => e.preventDefault()}
              style={watchServiceButtonStyle(label)}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold"
            >
              ▶ {label}
            </a>
          )
        }
        if (variantId === 'B') {
          return (
            <a
              key={label}
              href="#mock"
              onClick={(e) => e.preventDefault()}
              style={watchServiceButtonStyle(label)}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            >
              <ServiceBadge label={label} onDark />
              ▶ {label}
            </a>
          )
        }
        if (variantId === 'C') {
          return (
            <a
              key={label}
              href="#mock"
              onClick={(e) => e.preventDefault()}
              style={watchServiceButtonStyle(label)}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            >
              <ServiceBadge label={label} onDark />
              {label}
            </a>
          )
        }
        if (variantId === 'D') {
          return (
            <a
              key={label}
              href="#mock"
              title={label}
              onClick={(e) => e.preventDefault()}
              style={watchServiceButtonStyle(label)}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-2 text-xs font-black"
            >
              {label.replace('Disney+', 'D+').slice(0, 3)}
            </a>
          )
        }
        if (variantId === 'E') {
          return (
            <a
              key={label}
              href="#mock"
              onClick={(e) => e.preventDefault()}
              style={softBrandStyle(brand.bg, brand.bg)}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            >
              <ServiceBadge label={label} />
              {label}
            </a>
          )
        }
        return (
          <a
            key={label}
            href="#mock"
            onClick={(e) => e.preventDefault()}
            style={{ borderColor: brand.bg, color: brand.bg, backgroundColor: '#fff' }}
            className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-semibold"
          >
            <ServiceBadge label={label} />
            {label}
          </a>
        )
      })}
    </div>
  )
}

export default function MediaMixButtonMockPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-mint-500">임시 시안 · 비교</p>
        <h1 className="text-2xl font-bold text-ink-900">미디어믹스 · 플랫폼 바로가기 버튼</h1>
        <p className="text-sm text-ink-500">
          웹툰 플랫폼 바로가기와 OTT/나무위키 버튼을 시안별로 나란히 비교합니다. 확정안을 알려주시면 상세
          페이지에 반영할게요.
        </p>
        <p className="text-xs text-ink-400">/dev/media-mix-buttons</p>
      </header>

      <section className="rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="mb-2 text-sm font-bold text-ink-900">관련 목업 링크</h2>
        <ul className="space-y-1.5 text-sm">
          <li>
            <Link className="font-semibold text-mint-500 hover:underline" to="/dev/ai-summary-mark">
              /dev/ai-summary-mark
            </Link>
            <span className="text-ink-500"> — 로봇 쿼카 AI 요약 마크 후보</span>
          </li>
          <li>
            <Link className="font-semibold text-mint-500 hover:underline" to="/dev/ai-search">
              /dev/ai-search
            </Link>
            <span className="text-ink-500"> — AI 검색 UI + 쿼카 + 플랫폼 카드</span>
          </li>
          <li>
            <Link className="font-semibold text-mint-500 hover:underline" to="/webtoons/30043">
              /webtoons/30043
            </Link>
            <span className="text-ink-500"> — 실데이터 예: 무빙 (미디어믹스)</span>
          </li>
        </ul>
      </section>

      {VARIANTS.map((v) => (
        <section key={v.id} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
          <div>
            <h2 className="text-base font-bold text-ink-900">{v.title}</h2>
            <p className="text-xs text-ink-500">{v.desc}</p>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              웹툰 플랫폼 바로가기
            </p>
            <PlatformRow variantId={v.id} />
          </div>

          <div className="space-y-2 border-t border-ink-50 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              미디어믹스 · 나무위키 / OTT
            </p>
            <WatchRow variantId={v.id} />
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 p-5 text-xs text-ink-500">
        <p className="mb-1 font-semibold text-ink-700">참고</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>웹툰 플랫폼 로고: <code className="text-ink-700">/platform-logos/*</code></li>
          <li>OTT는 로고 파일이 없어 이니셜 뱃지로 대체 (원하면 아이콘 추가 가능)</li>
          <li>나무위키 브랜드색: {NAMU_WIKI_COLOR.bg}</li>
        </ul>
      </section>
    </div>
  )
}
