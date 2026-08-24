import { useEffect, useState } from 'react'
import { getExperienceLogs } from '../api/level'

export function useExperienceLogs(limit, userId) {
  const [state, setState] = useState({ userId: null, logs: [], error: '' })

  useEffect(() => {
    if (!userId) return undefined

    const controller = new AbortController()
    getExperienceLogs(limit, { signal: controller.signal })
      .then((logs) => {
        if (!controller.signal.aborted) {
          setState({ userId, logs: Array.isArray(logs) ? logs : [], error: '' })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ userId, logs: [], error: '경험치 내역을 불러오지 못했어요.' })
        }
      })

    return () => controller.abort()
  }, [limit, userId])

  const belongsToCurrentUser = Boolean(userId) && state.userId === userId
  return {
    logs: belongsToCurrentUser ? state.logs : [],
    loading: Boolean(userId) && !belongsToCurrentUser,
    error: belongsToCurrentUser ? state.error : '',
  }
}
