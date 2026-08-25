import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeQuickPrompts } from '../src/lib/quickPrompts.js'

test('quick prompts discard malformed and duplicate entries', () => {
  assert.deepEqual(
    normalizeQuickPrompts([
      { id: 1, label: '  힐링  ', query: '  편안한 웹툰  ' },
      { id: 2, label: '', query: '누락된 라벨' },
      { id: 3, label: '중복', query: '편안한 웹툰' },
      { id: 4, label: '로맨스', query: '설레는 로맨스' },
    ]),
    [
      { id: 1, label: '힐링', query: '편안한 웹툰' },
      { id: 4, label: '로맨스', query: '설레는 로맨스' },
    ],
  )
})

test('quick prompts are capped so unreviewed trailing values do not crowd the hero', () => {
  const prompts = Array.from({ length: 8 }, (_, index) => ({
    id: index + 1,
    label: `${index + 1}번 검색어`,
    query: `${index + 1}번 추천 요청`,
  }))

  assert.deepEqual(
    normalizeQuickPrompts(prompts).map((prompt) => prompt.id),
    [1, 2, 3, 4, 5],
  )
})
