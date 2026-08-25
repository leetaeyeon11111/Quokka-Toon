import assert from 'node:assert/strict'
import { buildAiPromptSuggestions } from '../src/lib/aiSearchPrompts.js'

const prompts = buildAiPromptSuggestions({
  tags: ['판타지', '로맨스'],
  genres: ['액션'],
  recentAi: ['비 오는 날 힐링 웹툰'],
  limit: 5,
})

assert.ok(prompts.length >= 1)
assert.equal(prompts[0].query, '비 오는 날 힐링 웹툰')
assert.ok(prompts.every((p) => p.label && p.query))
console.log('aiSearchPrompts ok', prompts.length)
