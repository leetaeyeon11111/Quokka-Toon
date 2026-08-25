import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getWebtoon, getWebtoonViewLink, searchWebtoons } from '../api/webtoon'
import { toDetailModel, toCardModel } from '../lib/webtoon'
import { useAuth } from '../hooks/useAuth'
import { useAppData } from '../hooks/useAppData'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { useExperienceNotification } from '../hooks/useExperienceNotification'
import * as reviewApi from '../api/review'
import { nicknameLevelClass } from '../lib/level'
import { LevelBadge } from '../components/common/LevelBadge'
import WebtoonCard from '../components/webtoon/WebtoonCard'
import Tag from '../components/webtoon/Tag'
import ScrollSpyNav from '../components/webtoon/ScrollSpyNav'
import GenderPieChart from '../components/webtoon/GenderPieChart'
import AlarmModal from '../components/mypage/AlarmModal'
import { StarsDisplay, StarsInput } from '../components/common/Stars'
import PlaceholderPage from '../components/common/PlaceholderPage'
import { loginHref } from '../lib/navigation'

const SECTIONS = [
  { id: 'info', label: '정보' },
  { id: 'recommend', label: '추천' },
  { id: 'stats', label: '성별 통계' },
  { id: 'reviews', label: '리뷰 평점' },
]

function SectionCard({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-ink-100 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-ink-900">{title}</h2>
      {children}
    </section>
  )
}

function HorizontalRow({ items, emptyText }) {
  if (!items.length) return <p className="text-sm text-ink-300">{emptyText}</p>
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
      {items.map((w) => (
        <WebtoonCard key={w.id} webtoon={w} />
      ))}
    </div>
  )
}

export default function WebtoonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { favorites, lifeWorks, toggleFavorite, toggleLifeWork, setAlarm } = useAppData()
  const { notifyExperience } = useExperienceNotification()

  const [webtoon, setWebtoon] = useState(null)
  const [webtoonLoading, setWebtoonLoading] = useState(true)
  const [webtoonError, setWebtoonError] = useState(false)
  const [heroImgOk, setHeroImgOk] = useState(true)
  const [viewLinkLoading, setViewLinkLoading] = useState(false)

  const [otherWorks, setOtherWorks] = useState([])
  const [similarWorks, setSimilarWorks] = useState([])

  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showAlarm, setShowAlarm] = useState(false)
  const [draftRating, setDraftRating] = useState(0)
  const [draftText, setDraftText] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewError, setReviewError] = useState('')

  // 상세 로드 (id 변경 시 화면 전용 상태 초기화)
  useEffect(() => {
    let cancelled = false
    async function load() {
      setWebtoon(null)
      setWebtoonLoading(true)
      setWebtoonError(false)
      setHeroImgOk(true)
      setOtherWorks([])
      setSimilarWorks([])
      setReviews([])
      setReviewsLoading(true)
      setReviewError('')
      setShowAllReviews(false)
      setDraftRating(0)
      setDraftText('')
      window.scrollTo({ top: 0 })
      try {
        const data = await getWebtoon(id)
        if (!cancelled) setWebtoon(toDetailModel(data))
      } catch {
        if (!cancelled) setWebtoonError(true)
      } finally {
        if (!cancelled) setWebtoonLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  // 추천: 같은 작가의 다른 작품 / 같은 장르(비슷한 작품)
  useEffect(() => {
    if (!webtoon) return
    let cancelled = false
    const selfId = webtoon.id
    if (webtoon.authors.writer && webtoon.authors.writer !== '미상') {
      searchWebtoons({ author: webtoon.authors.writer, size: 12 })
        .then((data) => {
          if (!cancelled) {
            setOtherWorks(
              (data?.content ?? []).map(toCardModel).filter((w) => w.id !== selfId).slice(0, 8),
            )
          }
        })
        .catch(() => {})
    }
    const genreForSimilar = webtoon.genres?.[0] ?? webtoon.genre
    if (genreForSimilar) {
      searchWebtoons({ genre: genreForSimilar, size: 14 })
        .then((data) => {
          if (!cancelled) {
            setSimilarWorks(
              (data?.content ?? []).map(toCardModel).filter((w) => w.id !== selfId).slice(0, 8),
            )
          }
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [webtoon])

  // 리뷰 로드
  useEffect(() => {
    if (!webtoon) return
    let cancelled = false
    reviewApi
      .listReviews(webtoon)
      .then((data) => {
        if (!cancelled) {
          setReviews(data)
          const mine = data.find((review) => review.mine)
          if (mine) {
            setDraftRating(mine.rating)
            setDraftText(mine.text)
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setReviews([])
          setReviewError(error.message ?? '리뷰를 불러오지 못했어요.')
        }
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [webtoon])

  const sections = useMemo(
    () => (webtoon?.demographics ? SECTIONS : SECTIONS.filter((section) => section.id !== 'stats')),
    [webtoon?.demographics],
  )
  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections])
  const activeId = useScrollSpy(sectionIds)

  if (webtoonLoading) {
    return <p className="py-24 text-center text-sm text-ink-500">불러오는 중…</p>
  }
  if (webtoonError || !webtoon) {
    return <PlaceholderPage title="작품을 찾을 수 없어요" description="주소를 다시 확인해주세요." />
  }

  const favorited = Boolean(favorites[webtoon.id])
  const isLifeWork = lifeWorks.includes(webtoon.id)
  const avgRating = reviews.length
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 0
  const popularReviews = [...reviews].sort((a, b) => b.likes - a.likes)
  const visibleReviews = showAllReviews ? popularReviews : popularReviews.slice(0, 2)
  const myReview = reviews.find((review) => review.mine)
  const showHeroImage = webtoon.thumbnailUrl && heroImgOk && !webtoon.isAdult

  function requireLogin(action) {
    if (!isLoggedIn) {
      navigate(loginHref(`/webtoons/${webtoon.id}`))
      return
    }
    action()
  }

  function handleToggleFavorite() {
    requireLogin(() => toggleFavorite(webtoon.id))
  }

  function handleToggleLifeWork() {
    requireLogin(() => toggleLifeWork(webtoon.id))
  }

  // "~에서 보기": 클릭 시 백엔드 /view-link 를 호출해 클라우드가 만든 정확한 링크로 이동.
  // 팝업 차단을 피하려고 클릭 즉시 빈 탭을 열고, 링크가 확정되면 그 탭을 이동시킨다.
  async function handleOpenPlatform(fallbackUrl) {
    const win = window.open('about:blank', '_blank')
    if (win) win.opener = null
    setViewLinkLoading(true)
    try {
      const res = await getWebtoonViewLink(webtoon.backendId ?? webtoon.id)
      const target = res?.url || fallbackUrl
      if (win) win.location.href = target
      else window.open(target, '_blank', 'noopener,noreferrer')
    } catch {
      // 조회 실패 시 로컬 링크로라도 이동
      if (win) win.location.href = fallbackUrl
      else window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setViewLinkLoading(false)
    }
  }

  async function submitReview(e) {
    e.preventDefault()
    if (!isLoggedIn) {
      navigate(loginHref(`/webtoons/${webtoon.id}#reviews`))
      return
    }
    const content = draftText.trim()
    if (draftRating === 0 || content.length < 20 || content.length > 2000) {
      setReviewError('별점과 공백을 제외한 20~2,000자의 리뷰를 입력해주세요.')
      return
    }
    try {
      const mine = reviews.find((review) => review.mine)
      const action = mine
        ? await reviewApi.updateReview(mine.id, { rating: draftRating, content })
        : await reviewApi.createReview(webtoon, { rating: draftRating, content })
      setReviews((current) => mine
        ? current.map((review) => review.id === mine.id ? action.result : review)
        : [action.result, ...current])
      notifyExperience(action.exp)
      setDraftRating(0)
      setDraftText('')
      setReviewError('')
    } catch (error) {
      setReviewError(error.message ?? '리뷰 저장에 실패했어요.')
    }
  }

  async function handleReviewLike(reviewId) {
    if (!isLoggedIn) {
      navigate(loginHref(`/webtoons/${webtoon.id}#reviews`))
      return
    }
    try {
      const action = await reviewApi.toggleReviewLike(reviewId)
      setReviews((current) => current.map((review) =>
        review.id === reviewId ? { ...review, ...action.result } : review))
    } catch (error) {
      setReviewError(error.message ?? '추천 처리에 실패했어요.')
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!confirm('리뷰를 삭제할까요?')) return
    try {
      await reviewApi.deleteReview(reviewId)
      setReviews((current) => current.filter((review) => review.id !== reviewId))
      setDraftRating(0)
      setDraftText('')
    } catch (error) {
      setReviewError(error.message ?? '리뷰 삭제에 실패했어요.')
    }
  }

  return (
    <div className="px-6 py-10">
      {/* 히어로 */}
      <div className="flex flex-col gap-6 md:flex-row">
        <div
          className="relative h-72 w-full shrink-0 overflow-hidden rounded-2xl border border-ink-100 md:h-96 md:w-72"
          style={{ background: webtoon.coverGradient }}
        >
          {showHeroImage && (
            <img
              src={webtoon.thumbnailUrl}
              alt={webtoon.title}
              onError={() => setHeroImgOk(false)}
              className="h-full w-full object-cover"
            />
          )}
          {webtoon.isAdult && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink-900/80 text-white backdrop-blur-sm">
              <span className="text-4xl" aria-hidden>
                🐿
              </span>
              <span className="text-sm font-medium">19금 가림</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-ink-900">{webtoon.title}</h1>
            <div className="flex items-center gap-1">
              {favorited && (
                <button
                  type="button"
                  onClick={() => setShowAlarm(true)}
                  aria-label="알람 설정"
                  className="text-xl text-brand-500"
                >
                  🔔
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label="즐겨찾기"
                className={`text-2xl ${favorited ? 'text-brand-500' : 'text-ink-300'}`}
              >
                {favorited ? '★' : '☆'}
              </button>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-ink-900 px-2.5 py-1 text-xs font-semibold text-white">
              {webtoon.genre}
            </span>
            <span className="text-ink-500">{webtoon.ageRating}</span>
            <span className="text-ink-500">· {webtoon.serialStatus}</span>
            <a href="#info" className="text-ink-500 hover:text-brand-500">
              작품정보 ›
            </a>
            <Link to="/board/webtoon" className="text-ink-500 hover:text-brand-500">
              💬 웹툰 게시판 ›
            </Link>
          </div>

          <p className="mb-3 text-sm text-ink-500">
            {webtoon.stats.weeklyDay !== '미정' && `매주 ${webtoon.stats.weeklyDay}요일 연재 · `}
            👁 {webtoon.stats.views.toLocaleString()} ·{' '}
            {webtoon.stats.ratingCount > 0
              ? `★ 리뷰 평균 ${webtoon.stats.ratingAvg.toFixed(1)}`
              : '아직 등록된 평점이 없어요'}
          </p>

          <p className="mb-3 text-sm text-ink-700">
            대표작가 · <span className="font-semibold">{webtoon.authors.writer}</span>
          </p>

          <div className="mb-6 flex flex-wrap gap-1.5">
            {webtoon.tags.map((tag) => (
              <Tag key={tag.name} name={tag.name} size="sm" />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleToggleLifeWork}
              className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                isLifeWork
                  ? 'border-brand-500 bg-brand-50 text-brand-600'
                  : 'border-ink-100 text-ink-700 hover:bg-ink-50'
              }`}
            >
              {isLifeWork ? '❤️ 인생작 담김' : '🤍 인생작 담기'}
            </button>
            {webtoon.platforms.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleOpenPlatform(p.url)}
                disabled={viewLinkLoading}
                className="flex items-center gap-1 rounded-full bg-mint-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-progress disabled:opacity-60"
              >
                {viewLinkLoading ? '링크 여는 중…' : `▶ ${p.name}에서 보기`}
              </button>
            ))}
          </div>
          {!isLoggedIn && (
            <p className="mt-2 text-xs text-ink-300">* 즐겨찾기·인생작 담기는 로그인 후 이용할 수 있어요.</p>
          )}
        </div>
      </div>

      {showAlarm && (
        <AlarmModal
          webtoon={webtoon}
          currentFreq={favorites[webtoon.id]?.alarmFreq}
          onSave={(freq) => setAlarm(webtoon.id, freq)}
          onClose={() => setShowAlarm(false)}
        />
      )}

      {/* 본문 + 스크롤스파이 */}
      <div className="mt-10 flex items-start gap-6">
        <div className="flex flex-1 flex-col gap-6">
          <SectionCard id="info" title="정보">
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-ink-50 p-4">
                <p className="mb-1 text-xs font-semibold text-ink-500">글작가</p>
                <p className="text-sm font-bold text-ink-900">{webtoon.authors.writer}</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-4">
                <p className="mb-1 text-xs font-semibold text-ink-500">그림작가</p>
                <p className="text-sm font-bold text-ink-900">{webtoon.authors.artist}</p>
              </div>
            </div>

            <p className="mb-1 text-sm font-bold text-ink-900">줄거리</p>
            <p className="mb-5 text-sm leading-relaxed text-ink-700">{webtoon.synopsis}</p>

            {webtoon.tags.length > 0 && (
              <>
                <p className="mb-2 text-sm font-bold text-ink-900">태그</p>
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {webtoon.tags.map((tag) => (
                    <Tag key={tag.name} name={tag.name} size="sm" />
                  ))}
                </div>
              </>
            )}

            {webtoon.aiSummary && (
              <div className="rounded-xl border border-mint-500 bg-mint-100 p-4">
                <p className="mb-1 flex items-center gap-1 text-sm font-bold text-mint-500">
                  ✨ AI 요약
                </p>
                <p className="text-sm text-ink-700">{webtoon.aiSummary}</p>
              </div>
            )}
          </SectionCard>

          <SectionCard id="recommend" title="추천">
            <p className="mb-2 text-sm font-bold text-ink-900">글/그림 작가의 다른 작품</p>
            <div className="mb-6">
              <HorizontalRow items={otherWorks} emptyText="같은 작가의 다른 작품이 아직 없어요." />
            </div>
            <p className="mb-2 text-sm font-bold text-ink-900">비슷한 작품</p>
            <HorizontalRow items={similarWorks} emptyText="비슷한 작품을 찾지 못했어요." />
          </SectionCard>

          {webtoon.demographics && <SectionCard id="stats" title="성별 통계">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-6">
              <GenderPieChart male={webtoon.demographics.genderRatio.male} female={webtoon.demographics.genderRatio.female} />
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="mb-1 text-2xl">🧍‍♂️</p>
                  <p className="text-lg font-bold text-ink-900">{webtoon.demographics.genderRating.male}</p>
                  <StarsDisplay rating={webtoon.demographics.genderRating.male} />
                </div>
                <div className="text-center">
                  <p className="mb-1 text-2xl">🧍‍♀️</p>
                  <p className="text-lg font-bold text-ink-900">{webtoon.demographics.genderRating.female}</p>
                  <StarsDisplay rating={webtoon.demographics.genderRating.female} />
                </div>
              </div>
            </div>

            <p className="mb-3 text-sm font-bold text-ink-900">나이대별 평점 (5점 만점 · 평균)</p>
            <div className="flex flex-col gap-2.5">
              {webtoon.demographics.ageRatings.map((row) => (
                <div key={row.age} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs font-semibold text-ink-500">{row.age}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(row.avg / 5) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs text-ink-500">
                    {row.avg} ({row.count}명)
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>}

          <SectionCard id="reviews" title="리뷰 평점">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-ink-900">
                {reviews.length > 0 ? (
                  <>평균 <span className="text-brand-500">★ {avgRating}</span> · 인기순 대표 리뷰</>
                ) : (
                  '아직 등록된 리뷰가 없어요'
                )}
              </p>
              {popularReviews.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllReviews((s) => !s)}
                  className="text-xs font-semibold text-ink-500 hover:text-brand-500"
                >
                  {showAllReviews ? '접기 ▲' : '리뷰 더보기 ▾'}
                </button>
              )}
            </div>

            <div className="mb-6 flex flex-col gap-3">
              {reviewsLoading && <p className="py-4 text-center text-sm text-ink-500">리뷰를 불러오는 중…</p>}
              {!reviewsLoading && !reviewError && visibleReviews.length === 0 && (
                <p className="py-4 text-center text-sm text-ink-500">첫 정식 리뷰를 남겨보세요.</p>
              )}
              {visibleReviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-ink-100 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <LevelBadge level={review.authorLevel} />
                      <span className={nicknameLevelClass(review.authorLevel)}>{review.user}</span>
                    </span>
                    <StarsDisplay rating={review.rating} />
                  </div>
                  <p className="mb-1 text-sm text-ink-700">{review.text}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleReviewLike(review.id)}
                      className={review.liked ? 'font-semibold text-brand-500' : 'text-ink-300 hover:text-brand-500'}
                    >
                      👍 추천 {review.likes}
                    </button>
                    {review.mine && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setDraftRating(review.rating)
                            setDraftText(review.text)
                          }}
                          className="text-ink-500 hover:text-brand-500"
                        >
                          수정
                        </button>
                        <button type="button" onClick={() => handleDeleteReview(review.id)} className="text-red-400 hover:text-red-600">
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {isLoggedIn ? <form onSubmit={submitReview} className="rounded-xl border border-dashed border-ink-100 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-ink-900">{myReview ? '내 정식 리뷰 수정' : '정식 리뷰 작성'}</p>
                <StarsInput value={draftRating} onChange={setDraftRating} />
              </div>
              <div className="flex gap-2">
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="공백을 제외하고 20~2,000자로 평가를 남겨주세요…"
                  minLength={20}
                  maxLength={2000}
                  rows={3}
                  className="flex-1 resize-none rounded-xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-300"
                />
                <button
                  type="submit"
                  className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-700"
                >
                  {myReview ? '수정' : '등록'}
                </button>
              </div>
              {reviewError && <p className="mt-2 text-xs text-red-500">{reviewError}</p>}
            </form> : (
              <div className="rounded-xl border border-dashed border-ink-100 p-6 text-center">
                <p className="mb-3 text-sm text-ink-500">로그인하고 이 작품의 첫 리뷰를 남겨보세요.</p>
                <Link
                  to={loginHref(`/webtoons/${webtoon.id}#reviews`)}
                  className="inline-flex rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-700"
                >
                  로그인 후 리뷰 작성
                </Link>
              </div>
            )}
          </SectionCard>
        </div>

        <ScrollSpyNav sections={sections} activeId={activeId} />
      </div>
    </div>
  )
}
