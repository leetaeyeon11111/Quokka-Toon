import { api } from './client'

export function getExperienceLogs(limit = 10, { signal } = {}) {
  const safeLimit = Math.max(1, Math.min(20, Number(limit) || 10))
  return api.get(`/api/level/logs?limit=${safeLimit}`, { signal })
}
