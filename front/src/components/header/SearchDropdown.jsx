import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const POPULAR_TAGS = [
  '러브코미디',
  'BL',
  '배틀연애',
  '강공',
  '오메가버스',
  '다각관계',
  '나쁜남자',
  '드라마',
  '집착남',
]

const AI_SENTENCES = [
  '소꿉친구랑 꽁냥꽁냥 대는 로맨스',
  '빌런을 참교육하는 사이다 복수극',
  '비 오는 날 읽기 좋은 힐링 만화',
  '두뇌싸움이 짜릿한 다크 판타지',
]

const INITIAL_KEYWORD_RECENT = ['애늙은이', '코믹 무협']
const INITIAL_AI_RECENT = [
  '견습기사 트루디아는 넘치는 재능을 숨긴다',
  '정통 판타지 액션 모험',
  '죽지 않는 남자와 견습기사',
  '죽지않는 주인공, 성장하는 이야기',
  '잔불의 기사',
]

export default function SearchDropdown({ onClose }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('keyword') // 'keyword' | 'ai'
  const [value, setValue] = useState('')
  const [keywordRecent, setKeywordRecent] = useState(INITIAL_KEYWORD_RECENT)
  const [aiRecent, setAiRecent] = useState(INITIAL_AI_RECENT)

  // 모드가 바뀌면 입력값을 비운다 (렌더 중 상태 조정 패턴).
  const [lastMode, setLastMode] = useState(mode)
  if (mode !== lastMode) {
    setLastMode(mode)
    setValue('')
  }

  const recent = mode === 'keyword' ? keywordRecent : aiRecent
  const setRecent = mode === 'keyword' ? setKeywordRecent : setAiRecent

  function submit(query) {
    const q = query ?? value
    if (!q.trim()) return
    setRecent((prev) => [q, ...prev.filter((item) => item !== q)].slice(0, 8))
    navigate(`/recommend?q=${encodeURIComponent(q)}${mode === 'ai' ? '&mode=ai' : ''}`)
    onClose()
  }

  return (
    <div className="absolute inset-x-0 top-full z-40 border-b border-ink-100 bg-white shadow-lg">
      <div className="mx-auto w-full max-w-3xl px-6 py-6">
        <div className="flex items-center gap-3 rounded-full border border-ink-100 bg-ink-50 px-2 py-2">
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'keyword' ? 'ai' : 'keyword'))}
            className={`flex h-9 items-center gap-1 rounded-full px-3 text-xs font-bold transition ${
              mode === 'ai' ? 'bg-mint-500 text-white' : 'bg-ink-200 text-ink-500'
            }`}
            aria-pressed={mode === 'ai'}
          >
            AI
            <span
              className={`ml-1 h-4 w-7 rounded-full bg-white/40 transition after:block after:h-3 after:w-3 after:translate-y-0.5 after:rounded-full after:bg-white after:transition ${
                mode === 'ai' ? 'after:translate-x-3.5' : 'after:translate-x-0.5'
              }`}
            />
          </button>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={mode === 'keyword' ? '작품, 작가, 출판사, 태그 검색' : '문장으로 검색해보세요'}
            className="flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300"
          />
          <button
            type="button"
            onClick={() => submit()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-white"
            aria-label="검색"
          >
            🔍
          </button>
        </div>

        {mode === 'ai' && (
          <p className="mt-3 text-xs text-ink-500">
            ⓘ 해당 AI는 이미지 생성형이 아니며, 작가님의 소중한 그림은 학습되지 않습니다.
          </p>
        )}

        {mode === 'ai' && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-bold text-ink-900">AI 추천 문장</h3>
            <div className="flex flex-wrap gap-2">
              {AI_SENTENCES.map((sentence) => (
                <button
                  key={sentence}
                  type="button"
                  onClick={() => submit(sentence)}
                  className="rounded-full border border-mint-500 px-3 py-1.5 text-left text-xs text-mint-500 transition hover:bg-mint-100"
                >
                  {sentence}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">최근 검색</h3>
            {recent.length > 0 && (
              <button
                type="button"
                onClick={() => setRecent([])}
                className="text-xs text-ink-300 underline"
              >
                전체 삭제
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="text-xs text-ink-300">최근 검색 내역이 없어요.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recent.map((item) => (
                <span
                  key={item}
                  className="flex max-w-[220px] items-center gap-1 rounded-full bg-ink-50 px-3 py-1.5 text-xs text-ink-700"
                >
                  <button type="button" className="truncate" onClick={() => submit(item)}>
                    {item}
                  </button>
                  <button
                    type="button"
                    aria-label="삭제"
                    className="text-ink-300 hover:text-ink-700"
                    onClick={() => setRecent((prev) => prev.filter((r) => r !== item))}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {mode === 'keyword' && (
          <>
            <div className="my-5 flex justify-center">
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white shadow-md transition hover:bg-brand-600"
              >
                #
              </button>
            </div>
            <p className="mb-3 text-center text-sm font-bold text-brand-600"># 태그로 작품 찾기</p>

            <h3 className="mb-2 text-sm font-bold text-ink-900">인기 태그</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => submit(`#${tag}`)}
                  className="rounded-full border border-ink-100 px-3 py-1.5 text-xs text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 text-right">
          <button type="button" onClick={onClose} className="text-sm text-ink-500 hover:text-ink-900">
            닫기 ✕
          </button>
        </div>
      </div>
    </div>
  )
}
