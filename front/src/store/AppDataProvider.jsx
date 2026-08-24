import { useEffect, useMemo, useReducer } from 'react'
import { AppDataContext } from './app-data-context'
import { useAuth } from '../hooks/useAuth'
import { BOARD_SEED } from '../data/boardPosts'
import { INQUIRY_SEED } from '../data/inquiries'
import { REPORT_SEED } from '../data/reports'

// 공용 콘텐츠(게시판·문의·신고·리뷰)는 모든 사용자가 공유하므로 전역 키에 저장한다.
const STORAGE_KEY = 'quakatoon:appdata'
// 즐겨찾기·인생작은 사용자별 데이터이므로 userId 별로 분리해 저장한다.
const USER_STORAGE_PREFIX = 'quakatoon:userdata:'

const userStorageKey = (userId) => `${USER_STORAGE_PREFIX}${userId}`

const INITIAL_STATE = {
  extraReviews: {}, // { [webtoonId]: Review[] }
  posts: BOARD_SEED,
  inquiries: INQUIRY_SEED,
  reports: REPORT_SEED,
  bannedUsers: {}, // { [username]: { days, reason } }
}

// 로그인한 사용자별로 유지되는 데이터 (로그아웃 시 비워짐)
const INITIAL_USER_STATE = {
  ownerId: null, // 현재 담긴 데이터의 소유자 userId (저장 경쟁 방지용)
  favorites: {}, // { [webtoonId]: { alarmFreq: '2주' } }
  lifeWorks: [], // webtoonId[]
}

function readStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_STATE
    const parsed = JSON.parse(raw)
    return { ...INITIAL_STATE, ...parsed }
  } catch {
    return INITIAL_STATE
  }
}

// 특정 사용자의 즐겨찾기·인생작을 불러온다. 비로그인(userId 없음)이면 빈 상태.
function readUserState(userId) {
  if (!userId) return { ...INITIAL_USER_STATE }
  try {
    const raw = localStorage.getItem(userStorageKey(userId))
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      ownerId: userId,
      favorites: parsed.favorites ?? {},
      lifeWorks: parsed.lifeWorks ?? [],
    }
  } catch {
    return { ownerId: userId, favorites: {}, lifeWorks: [] }
  }
}

// 사용자별 데이터(즐겨찾기·인생작) 전용 리듀서
function userReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_USER':
      return action.payload

    case 'TOGGLE_FAVORITE': {
      const { webtoonId } = action
      const next = { ...state.favorites }
      if (next[webtoonId]) delete next[webtoonId]
      else next[webtoonId] = { alarmFreq: '2주' }
      return { ...state, favorites: next }
    }

    case 'SET_ALARM': {
      const { webtoonId, freq } = action
      if (!state.favorites[webtoonId]) return state
      return {
        ...state,
        favorites: { ...state.favorites, [webtoonId]: { ...state.favorites[webtoonId], alarmFreq: freq } },
      }
    }

    case 'TOGGLE_LIFEWORK': {
      const { webtoonId } = action
      const exists = state.lifeWorks.includes(webtoonId)
      return {
        ...state,
        lifeWorks: exists
          ? state.lifeWorks.filter((id) => id !== webtoonId)
          : [...state.lifeWorks, webtoonId],
      }
    }

    default:
      return state
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_REVIEW': {
      const { webtoonId, review } = action
      const list = state.extraReviews[webtoonId] ?? []
      return { ...state, extraReviews: { ...state.extraReviews, [webtoonId]: [review, ...list] } }
    }

    case 'ADD_POST': {
      return { ...state, posts: [action.post, ...state.posts] }
    }

    case 'DELETE_POST': {
      return { ...state, posts: state.posts.filter((p) => p.id !== action.postId) }
    }

    case 'ADD_COMMENT': {
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.postId ? { ...post, comments: [...post.comments, action.comment] } : post,
        ),
      }
    }

    case 'REACT_POST': {
      const field = action.kind === 'like' ? 'likes' : 'dislikes'
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.postId ? { ...post, [field]: post[field] + 1 } : post,
        ),
      }
    }

    case 'REACT_COMMENT': {
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id !== action.postId
            ? post
            : {
                ...post,
                comments: post.comments.map((c) =>
                  c.id === action.commentId ? { ...c, likes: c.likes + 1 } : c,
                ),
              },
        ),
      }
    }

    case 'SUBMIT_INQUIRY': {
      return { ...state, inquiries: [action.inquiry, ...state.inquiries] }
    }

    case 'ANSWER_INQUIRY': {
      return {
        ...state,
        inquiries: state.inquiries.map((inq) =>
          inq.id === action.id ? { ...inq, status: '답변완료', answer: action.answer } : inq,
        ),
      }
    }

    case 'DELETE_INQUIRY': {
      return { ...state, inquiries: state.inquiries.filter((inq) => inq.id !== action.id) }
    }

    case 'BAN_USER': {
      const { username, days, reason, reportId, deletePostId } = action
      return {
        ...state,
        bannedUsers: { ...state.bannedUsers, [username]: { days, reason } },
        posts: deletePostId ? state.posts.filter((p) => p.id !== deletePostId) : state.posts,
        reports: reportId ? state.reports.filter((r) => r.id !== reportId) : state.reports,
      }
    }

    case 'RESOLVE_REPORT': {
      return { ...state, reports: state.reports.filter((r) => r.id !== action.id) }
    }

    default:
      return state
  }
}

export function AppDataProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.userId ?? null

  const [state, dispatch] = useReducer(reducer, undefined, readStoredState)
  const [userState, userDispatch] = useReducer(userReducer, INITIAL_USER_STATE)

  // 공용 콘텐츠 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // 로그인 사용자가 바뀌면 해당 사용자의 즐겨찾기·인생작을 다시 불러온다.
  // (로그아웃 → userId=null → 빈 상태로 교체되어 화면에서도 사라진다)
  useEffect(() => {
    userDispatch({ type: 'HYDRATE_USER', payload: readUserState(userId) })
  }, [userId])

  // 사용자별 데이터 저장. 로그인 상태이고, 현재 상태가 그 사용자 소유일 때만 저장한다.
  // (로그인 직후 hydrate 완료 전에 빈 상태로 덮어써 버리는 경쟁을 방지)
  useEffect(() => {
    if (!userId || userState.ownerId !== userId) return
    localStorage.setItem(
      userStorageKey(userId),
      JSON.stringify({ favorites: userState.favorites, lifeWorks: userState.lifeWorks }),
    )
  }, [userId, userState])

  const actions = useMemo(
    () => ({
      toggleFavorite: (webtoonId) => userDispatch({ type: 'TOGGLE_FAVORITE', webtoonId }),
      setAlarm: (webtoonId, freq) => userDispatch({ type: 'SET_ALARM', webtoonId, freq }),
      toggleLifeWork: (webtoonId) => userDispatch({ type: 'TOGGLE_LIFEWORK', webtoonId }),
      addReview: (webtoonId, review) => dispatch({ type: 'ADD_REVIEW', webtoonId, review }),
      addPost: (post) => dispatch({ type: 'ADD_POST', post }),
      deletePost: (postId) => dispatch({ type: 'DELETE_POST', postId }),
      addComment: (postId, comment) => dispatch({ type: 'ADD_COMMENT', postId, comment }),
      reactPost: (postId, kind) => dispatch({ type: 'REACT_POST', postId, kind }),
      reactComment: (postId, commentId, kind) => dispatch({ type: 'REACT_COMMENT', postId, commentId, kind }),
      submitInquiry: (inquiry) => dispatch({ type: 'SUBMIT_INQUIRY', inquiry }),
      answerInquiry: (id, answer) => dispatch({ type: 'ANSWER_INQUIRY', id, answer }),
      deleteInquiry: (id) => dispatch({ type: 'DELETE_INQUIRY', id }),
      resolveReport: (id) => dispatch({ type: 'RESOLVE_REPORT', id }),
      banUser: (username, days, reason, reportId, deletePostId) =>
        dispatch({ type: 'BAN_USER', username, days, reason, reportId, deletePostId }),
    }),
    [],
  )

  const value = useMemo(
    () => ({
      ...state,
      favorites: userState.favorites,
      lifeWorks: userState.lifeWorks,
      ...actions,
    }),
    [state, userState, actions],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
