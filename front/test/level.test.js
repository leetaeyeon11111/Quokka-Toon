import test from 'node:test'
import assert from 'node:assert/strict'
import { levelLabel, nicknameLevelClass } from '../src/lib/level.js'

test('max level uses MAX label and dedicated accessible brand class', () => {
  assert.equal(levelLabel({ level: 100, maxLevel: true }), 'Lv.100 MAX')
  assert.equal(nicknameLevelClass(100), 'level-nickname-max')
})

test('nickname colors change at every ten-level band', () => {
  const colors = Array.from({ length: 10 }, (_, index) => nicknameLevelClass(index * 10 + 1))
  assert.equal(new Set(colors).size, 10)
  assert.equal(nicknameLevelClass(9), nicknameLevelClass(1))
  assert.notEqual(nicknameLevelClass(10), nicknameLevelClass(9))
})
