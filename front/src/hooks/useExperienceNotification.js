import { useContext } from 'react'
import { ExperienceNotificationContext } from '../context/experience-notification-context'

export function useExperienceNotification() {
  const value = useContext(ExperienceNotificationContext)
  if (!value) throw new Error('ExperienceNotificationProvider가 필요합니다.')
  return value
}
