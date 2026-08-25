import test from 'node:test'
import assert from 'node:assert/strict'
import { readSessionValue, writeSessionValue } from '../src/lib/sessionStorage.js'

test('session storage failures fall back without throwing', () => {
  assert.equal(readSessionValue('missing'), null)
  assert.equal(writeSessionValue('key', 'value'), false)
})
