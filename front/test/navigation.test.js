import test from 'node:test'
import assert from 'node:assert/strict'
import { loginHref, webtoonHref } from '../src/lib/navigation.js'

test('real webtoon ids link to detail and local sample ids fall back to title search', () => {
  assert.equal(webtoonHref({ id: 116022, title: '마네킹' }), '/webtoons/116022')
  assert.equal(webtoonHref({ id: 'wt-3', title: '여신강림' }), '/webtoons?q=%EC%97%AC%EC%8B%A0%EA%B0%95%EB%A6%BC')
})

test('login link preserves the intended destination', () => {
  assert.equal(loginHref('/mypage/taste?tab=tags'), '/login?returnTo=%2Fmypage%2Ftaste%3Ftab%3Dtags')
})
