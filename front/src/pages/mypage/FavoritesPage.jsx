import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../../hooks/useAppData'
import { fetchWebtoonModelsByIds } from '../../lib/webtoon'
import MyPageShell from '../../components/mypage/MyPageShell'
import AlarmModal from '../../components/mypage/AlarmModal'
import AdultCoverMark from '../../components/common/AdultCoverMark'

function Thumb({ webtoon }) {
  const [imgOk, setImgOk] = useState(true)
  const showImage = webtoon.thumbnailUrl && imgOk && !webtoon.isAdult
  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-lg"
      style={{ background: webtoon.coverGradient }}
    >
      {showImage && (
        <img
          src={webtoon.thumbnailUrl}
          alt=""
          loading="lazy"
          onError={() => setImgOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {webtoon.isAdult && (
        <div className="absolute inset-0 bg-black text-white">
          <AdultCoverMark fill />
          <span className="absolute inset-x-0 bottom-1.5 text-center text-[10px] font-medium drop-shadow">
            19금 가림
          </span>
        </div>
      )}
    </div>
  )
}

function Thumb({ webtoon }) {
  const [imgOk, setImgOk] = useState(true)
  const showImage = webtoon.thumbnailUrl && imgOk && !webtoon.isAdult
  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-lg"
      style={{ background: webtoon.coverGradient }}
    >
      {showImage && (
        <img
          src={webtoon.thumbnailUrl}
          alt=""
          loading="lazy"
          onError={() => setImgOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {webtoon.isAdult && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900/80 text-2xl">
          🐿
        </div>
      )}
    </div>
  )
}

export default function FavoritesPage() {
  const { favorites, toggleFavorite, setAlarm } = useAppData()
  const [sortDesc, setSortDesc] = useState(true)
  const [alarmTarget, setAlarmTarget] = useState(null)
  const [webtoons, setWebtoons] = useState([])
  const [loading, setLoading] = useState(true)

  const favoriteIds = useMemo(() => Object.keys(favorites), [favorites])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const models = await fetchWebtoonModelsByIds(favoriteIds)
      if (!cancelled) {
        setWebtoons(models)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [favoriteIds])

  const items = useMemo(() => {
    const list = webtoons.map((webtoon) => ({ webtoon, meta: favorites[webtoon.id] ?? {} }))
    return sortDesc ? [...list].reverse() : list
  }, [webtoons, favorites, sortDesc])

  return (
    <MyPageShell>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-500">
          카드마다 <span className="text-brand-500">★</span> 즐겨찾기 · <span className="text-brand-500">🔔</span> 알람 토글(켜짐=주황)
        </p>
        <button
          type="button"
          onClick={() => setSortDesc((s) => !s)}
          className="rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700"
        >
          최근순 {sortDesc ? '↓' : '↑'}
        </button>
      </div>

      {loading ? (
        <p className="py-20 text-center text-sm text-ink-500">불러오는 중…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-100 bg-white py-20 text-center text-ink-500">
          <span className="text-3xl" aria-hidden>
            🐿
          </span>
          <p>아직 즐겨찾기한 작품이 없어요.</p>
          <Link to="/webtoons" className="text-sm font-semibold text-brand-500 hover:underline">
            웹툰 둘러보러 가기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map(({ webtoon, meta }) => (
            <div key={webtoon.id} className="rounded-xl border border-ink-100 bg-white p-2">
              <Link to={`/webtoons/${webtoon.id}`}>
                <Thumb webtoon={webtoon} />
                <p className="mt-2 truncate text-sm font-semibold text-ink-900">{webtoon.title}</p>
              </Link>
              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  aria-label="즐겨찾기 해제"
                  onClick={() => toggleFavorite(webtoon.id)}
                  className="text-lg text-brand-500"
                >
                  ★
                </button>
                <button
                  type="button"
                  aria-label="알람 설정"
                  onClick={() => setAlarmTarget(webtoon)}
                  className="text-lg text-brand-500"
                  title={meta.alarmFreq}
                >
                  🔔
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {alarmTarget && (
        <AlarmModal
          webtoon={alarmTarget}
          currentFreq={favorites[alarmTarget.id]?.alarmFreq}
          onSave={(freq) => setAlarm(alarmTarget.id, freq)}
          onClose={() => setAlarmTarget(null)}
        />
      )}
    </MyPageShell>
  )
}
