import test from 'node:test'
import assert from 'node:assert/strict'
import { getSheetSnapDestination } from '../src/lib/homeSheet.js'

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
