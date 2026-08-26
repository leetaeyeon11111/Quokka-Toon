import test from 'node:test'
import assert from 'node:assert/strict'
import { getVisitorId } from '../src/lib/visitor.js'

test('visitor id falls back safely outside a browser', () => {
  assert.equal(getVisitorId(), 'anonymous')
})

test('visitor id is created once and then reused from local storage', () => {
  const values = new Map()
  globalThis.window = {
    crypto: { randomUUID: () => '12345678-1234-1234-1234-123456789abc' },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  }

  try {
    const first = getVisitorId()
    assert.equal(first, '12345678_1234_1234_1234_123456789abc')
    assert.equal(getVisitorId(), first)
  } finally {
    delete globalThis.window
  }
})

test('blocked storage falls back without breaking detail navigation', () => {
  globalThis.window = {
    crypto: {},
    localStorage: {
      getItem: () => {
        throw new Error('blocked')
      },
    },
  }

  try {
    assert.equal(getVisitorId(), 'anonymous')
  } finally {
    delete globalThis.window
  }
})
