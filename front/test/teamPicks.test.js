import assert from 'node:assert/strict'
import test from 'node:test'
import { drawTeamPick, reviewedTeamPickIds } from '../src/data/teamPicks.js'

test('team picks keep only unique, reviewed, non-test webtoons', () => {
  const items = [
    { id: 24523, title: '게임 속 바바리안으로 살아남기', ratingCount: 26 },
    { id: 24122, title: '전지적 독자 시점', ratingCount: 7 },
    { id: 24122, title: '전지적 독자 시점', ratingCount: 7 },
    { id: 24943, title: '여신강림', ratingCount: 0 },
    { id: 1, title: '테스트 웹툰', ratingCount: 1 },
    { id: 44939, title: '카카오 가라사대', ratingCount: 1 },
    { id: 27884, title: '악녀의 시집살이는 즐겁다', ratingCount: 1 },
  ]

  assert.deepEqual(reviewedTeamPickIds(items), [24523, 24122])
})

test('team picks exhaust a shuffled bag and avoid a duplicate across reshuffles', () => {
  const ids = [10, 20, 30]
  const drawn = []
  let state = {}

  for (let index = 0; index < ids.length + 1; index += 1) {
    const result = drawTeamPick(ids, state, () => 0)
    drawn.push(result.id)
    state = result.state
  }

  assert.equal(new Set(drawn.slice(0, ids.length)).size, ids.length)
  assert.notEqual(drawn[ids.length - 1], drawn[ids.length])
})
