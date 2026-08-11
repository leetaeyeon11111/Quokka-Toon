import { useContext } from 'react'
import { AppDataContext } from '../store/app-data-context'

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
