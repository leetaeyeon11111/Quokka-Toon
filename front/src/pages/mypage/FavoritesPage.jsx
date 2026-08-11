import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWebtoonById } from '../../data/webtoons'
import { useAppData } from '../../hooks/useAppData'
import MyPageShell from '../../components/mypage/MyPageShell'
import AlarmModal from '../../components/mypage/AlarmModal'

export default function FavoritesPage() {
  const { favorites, toggleFavorite, setAlarm } = useAppData()
  const [sortDesc, setSortDesc] = useState(true)
  const [alarmTarget, setAlarmTarget] = useState(null)

  const items = useMemo(() => {
    const list = Object.entries(favorites)
      .map(([id, meta]) => ({ webtoon: getWebtoonById(id), meta }))
      .filter((item) => item.webtoon)
    return sortDesc ? list.reverse() : list
  }, [favorites, sortDesc])

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

      {items.length === 0 ? (
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
                <div
                  className="aspect-[3/4] w-full rounded-lg"
                  style={{ background: webtoon.coverGradient }}
                />
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
