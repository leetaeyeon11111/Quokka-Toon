const FLICK_VELOCITY_THRESHOLD = 0.3
const FLICK_FRESHNESS_MS = 80
const WHEEL_GESTURE_THRESHOLD = 160
export const SHEET_WHEEL_GESTURE_IDLE_MS = 320
const SHEET_POSITION_EPSILON = 2

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

export function advanceSheetWheelGesture(
  { direction = 0, distance = 0, lastTime = 0 },
  deltaY,
  now,
) {
  const nextDirection = Math.sign(deltaY)
  if (!Number.isFinite(deltaY) || nextDirection === 0) {
    return { direction, distance, lastTime, triggered: false }
  }

  const gestureExpired = now - lastTime > SHEET_WHEEL_GESTURE_IDLE_MS
  const nextDistance =
    gestureExpired || direction !== nextDirection ? Math.abs(deltaY) : distance + Math.abs(deltaY)
  const triggered = nextDistance >= WHEEL_GESTURE_THRESHOLD

  return {
    direction: triggered ? 0 : nextDirection,
    distance: triggered ? 0 : nextDistance,
    lastTime: now,
    triggered,
  }
}

export function getSheetWheelIntent({ current, heroTop, contentTop, deltaY }) {
  if (![current, heroTop, contentTop, deltaY].every(Number.isFinite) || deltaY === 0) {
    return { type: 'native' }
  }

  const atHero = current <= heroTop + SHEET_POSITION_EPSILON
  const atContentTop =
    current >= contentTop - SHEET_POSITION_EPSILON &&
    current <= contentTop + SHEET_POSITION_EPSILON
  const inTransitionZone =
    current > heroTop + SHEET_POSITION_EPSILON &&
    current < contentTop - SHEET_POSITION_EPSILON

  if (inTransitionZone) {
    return { type: 'repair', destination: deltaY < 0 ? 'hero' : 'content' }
  }

  if (atHero) {
    return deltaY > 0 ? { type: 'gesture', deltaY } : { type: 'blocked' }
  }

  if (atContentTop) {
    return deltaY < 0 ? { type: 'gesture', deltaY } : { type: 'native' }
  }

  const projected = current + deltaY
  const crossesContentTop =
    current > contentTop + SHEET_POSITION_EPSILON &&
    deltaY < 0 &&
    projected <= contentTop + SHEET_POSITION_EPSILON

  if (crossesContentTop) {
    return {
      type: 'crossing',
      snapTop: contentTop,
      deltaY: Math.min(0, projected - contentTop),
    }
  }

  return { type: 'native' }
}

export function shouldUnlockSheetScroll({ current, contentTop }) {
  return (
    Number.isFinite(current) &&
    Number.isFinite(contentTop) &&
    current >= contentTop - SHEET_POSITION_EPSILON
  )
}

export function getSheetKeyboardDestination({
  current,
  heroTop,
  contentTop,
  key,
  shiftKey = false,
}) {
  if (![current, heroTop, contentTop].every(Number.isFinite)) return null

  const atHero = current <= heroTop + SHEET_POSITION_EPSILON
  const atContentTop =
    current >= contentTop - SHEET_POSITION_EPSILON &&
    current <= contentTop + SHEET_POSITION_EPSILON
  const movesForward = key === 'PageDown' || key === 'ArrowDown' || (key === ' ' && !shiftKey)
  const movesBackward = key === 'PageUp' || key === 'ArrowUp' || (key === ' ' && shiftKey)

  if (atHero && movesForward) return 'content'
  if (atContentTop && movesBackward) return 'hero'
  return null
}
