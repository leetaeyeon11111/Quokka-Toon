import test from 'node:test'
import assert from 'node:assert/strict'
import {
  advanceSheetWheelGesture,
  getSheetKeyboardDestination,
  getSheetSnapDestination,
  getSheetWheelIntent,
  shouldUnlockSheetScroll,
} from '../src/lib/homeSheet.js'

test('collapsed sheet opens after crossing one quarter and otherwise returns to hero', () => {
  assert.equal(getSheetSnapDestination({ startedExpanded: false, progress: 0.24 }), 'hero')
  assert.equal(getSheetSnapDestination({ startedExpanded: false, progress: 0.25 }), 'content')
})

test('expanded sheet closes after being pulled down one quarter', () => {
  assert.equal(getSheetSnapDestination({ startedExpanded: true, progress: 0.76 }), 'content')
  assert.equal(getSheetSnapDestination({ startedExpanded: true, progress: 0.75 }), 'hero')
})

test('a fresh flick can complete the gesture before the distance threshold', () => {
  assert.equal(
    getSheetSnapDestination({
      startedExpanded: false,
      progress: 0.1,
      velocity: 0.31,
      velocityAge: 20,
    }),
    'content',
  )
  assert.equal(
    getSheetSnapDestination({
      startedExpanded: true,
      progress: 0.9,
      velocity: -0.31,
      velocityAge: 20,
    }),
    'hero',
  )
})

test('stale velocity is ignored after the user pauses before release', () => {
  assert.equal(
    getSheetSnapDestination({
      startedExpanded: false,
      progress: 0.1,
      velocity: 0.8,
      velocityAge: 100,
    }),
    'hero',
  )
  assert.equal(
    getSheetSnapDestination({
      startedExpanded: true,
      progress: 0.9,
      velocity: -0.8,
      velocityAge: 100,
    }),
    'content',
  )
})

test('wheel gesture switches only after enough distance accumulates', () => {
  const initial = { direction: 0, distance: 0, lastTime: 0 }
  const first = advanceSheetWheelGesture(initial, 70, 10)
  const second = advanceSheetWheelGesture(first, 70, 30)
  const third = advanceSheetWheelGesture(second, 30, 50)

  assert.equal(first.triggered, false)
  assert.equal(second.triggered, false)
  assert.equal(third.triggered, true)
})

test('wheel gesture resets after changing direction or pausing', () => {
  const initial = { direction: 0, distance: 0, lastTime: 0 }
  const forward = advanceSheetWheelGesture(initial, 120, 10)
  const reversed = advanceSheetWheelGesture(forward, -60, 30)
  const expired = advanceSheetWheelGesture(forward, 60, 400)

  assert.equal(reversed.distance, 60)
  assert.equal(reversed.triggered, false)
  assert.equal(expired.distance, 60)
  assert.equal(expired.triggered, false)
})

test('wheel intent preserves native scrolling inside popular content', () => {
  assert.deepEqual(
    getSheetWheelIntent({ current: 1200, heroTop: 0, contentTop: 900, deltaY: -100 }),
    { type: 'native' },
  )
  assert.deepEqual(
    getSheetWheelIntent({ current: 900, heroTop: 0, contentTop: 900, deltaY: 100 }),
    { type: 'native' },
  )
})

test('wheel intent captures the overshoot when upward scrolling crosses content top', () => {
  assert.deepEqual(
    getSheetWheelIntent({ current: 940, heroTop: 0, contentTop: 900, deltaY: -100 }),
    { type: 'crossing', snapTop: 900, deltaY: -60 },
  )
})

test('wheel intent repairs an invalid middle position instead of trapping it', () => {
  assert.deepEqual(
    getSheetWheelIntent({ current: 40, heroTop: 0, contentTop: 900, deltaY: -100 }),
    { type: 'repair', destination: 'hero' },
  )
  assert.deepEqual(
    getSheetWheelIntent({ current: 40, heroTop: 0, contentTop: 900, deltaY: 100 }),
    { type: 'repair', destination: 'content' },
  )
})

test('history-restored content positions release the hero scroll lock', () => {
  assert.equal(shouldUnlockSheetScroll({ current: 900, contentTop: 900 }), true)
  assert.equal(shouldUnlockSheetScroll({ current: 1200, contentTop: 900 }), true)
  assert.equal(shouldUnlockSheetScroll({ current: 0, contentTop: 900 }), false)
})

test('keyboard paging moves between the locked hero and content boundary', () => {
  assert.equal(
    getSheetKeyboardDestination({ current: 0, heroTop: 0, contentTop: 900, key: 'PageDown' }),
    'content',
  )
  assert.equal(
    getSheetKeyboardDestination({ current: 900, heroTop: 0, contentTop: 900, key: 'ArrowUp' }),
    'hero',
  )
  assert.equal(
    getSheetKeyboardDestination({ current: 1200, heroTop: 0, contentTop: 900, key: 'PageUp' }),
    null,
  )
})
