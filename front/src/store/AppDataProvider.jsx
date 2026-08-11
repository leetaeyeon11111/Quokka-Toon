import { useEffect, useMemo, useReducer } from 'react'
import { AppDataContext } from './app-data-context'
import { BOARD_SEED } from '../data/boardPosts'
import { INQUIRY_SEED } from '../data/inquiries'
import { REPORT_SEED } from '../data/reports'

const STORAGE_KEY = 'quakatoon:appdata'

const INITIAL_STATE = {
  favorites: {}, // { [webtoonId]: { alarmFreq: '2주' } }
  lifeWorks: [], // webtoonId[]
  extraReviews: {}, // { [webtoonId]: Review[] }
  posts: BOARD_SEED,
  inquiries: INQUIRY_SEED,
  reports: REPORT_SEED,
  bannedUsers: {}, // { [username]: { days, reason } }
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

function reducer(state, action) {
  switch (action.type) {
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
  const [state, dispatch] = useReducer(reducer, undefined, readStoredState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const actions = useMemo(
    () => ({
      toggleFavorite: (webtoonId) => dispatch({ type: 'TOGGLE_FAVORITE', webtoonId }),
      setAlarm: (webtoonId, freq) => dispatch({ type: 'SET_ALARM', webtoonId, freq }),
      toggleLifeWork: (webtoonId) => dispatch({ type: 'TOGGLE_LIFEWORK', webtoonId }),
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

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
