import assert from 'node:assert/strict'
import test from 'node:test'
import { rankTasteTags } from '../src/lib/tasteTags.js'

test('taste tags exclude publishing metadata and rank meaningful tags', () => {
  const counts = new Map([
    ['완결', 9],
    ['월요일 연재', 8],
    ['기다무', 7],
    ['로맨스', 4],
    ['성장물', 6],
    ['힐링', 5],
  ])

  assert.deepEqual(rankTasteTags(counts, 2), [
    ['성장물', 6],
    ['힐링', 5],
  ])
})
