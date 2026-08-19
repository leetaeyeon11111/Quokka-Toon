const FLICK_VELOCITY_THRESHOLD = 0.3
const FLICK_FRESHNESS_MS = 80

function clampProgress(value) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function getSheetSnapDestination({
  startedExpanded,
  progress,
  velocity = 0,
  velocityAge = 0,
}) {
  const currentProgress = clampProgress(progress)
  const recentVelocity =
    Number.isFinite(velocity) && velocityAge <= FLICK_FRESHNESS_MS ? velocity : 0

  if (startedExpanded) {
    return currentProgress <= 0.75 || recentVelocity < -FLICK_VELOCITY_THRESHOLD
      ? 'hero'
      : 'content'
  }

  return currentProgress >= 0.25 || recentVelocity > FLICK_VELOCITY_THRESHOLD
    ? 'content'
    : 'hero'
}
