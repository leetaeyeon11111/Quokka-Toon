import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isTasteMetaTag, isTasteReportNoiseTag, rankTasteTags } from '../src/lib/tasteTags.js'

describe('taste tag metadata filtering', () => {
  it('excludes completion and wait-free style tags', () => {
    assert.equal(isTasteReportNoiseTag('완결'), true)
    assert.equal(isTasteReportNoiseTag('완결드라마'), true)
    assert.equal(isTasteReportNoiseTag('완결로맨스'), true)
    assert.equal(isTasteReportNoiseTag('기다무'), true)
    assert.equal(isTasteReportNoiseTag('기다리면무료'), true)
  })

  it('excludes serial, price, age and weekday meta tags', () => {
    assert.equal(isTasteReportNoiseTag('연재중'), true)
    assert.equal(isTasteReportNoiseTag('휴재'), true)
    assert.equal(isTasteReportNoiseTag('무료'), true)
    assert.equal(isTasteReportNoiseTag('부분유료'), true)
    assert.equal(isTasteReportNoiseTag('19금'), true)
    assert.equal(isTasteReportNoiseTag('신작'), true)
    assert.equal(isTasteReportNoiseTag('독점'), true)
    assert.equal(isTasteReportNoiseTag('월요웹툰'), true)
    assert.equal(isTasteReportNoiseTag('월요일 연재'), true)
    assert.equal(isTasteMetaTag('매주 금요일 연재'), true)
  })

  it('keeps genuine taste tags', () => {
    assert.equal(isTasteReportNoiseTag('회귀'), false)
    assert.equal(isTasteReportNoiseTag('사이다'), false)
    assert.equal(isTasteReportNoiseTag('로맨스'), false)
    assert.equal(isTasteReportNoiseTag('독점욕'), false)
  })
})

describe('rankTasteTags', () => {
  it('drops noise tags then returns top N by count', () => {
    const ranked = rankTasteTags(
      new Map([
        ['완결', 10],
        ['완결드라마', 9],
        ['기다무', 8],
        ['월요웹툰', 7],
        ['회귀', 6],
        ['사이다', 5],
        ['로맨스', 4],
        ['힐링', 3],
        ['복수', 2],
      ]),
      5,
    )
    assert.deepEqual(
      ranked.map(([name]) => name),
      ['회귀', '사이다', '로맨스', '힐링', '복수'],
    )
  })

  it('excludes non-positive counts and sorts ties consistently', () => {
    const counts = new Map([
      ['완결', 9],
      ['월요일 연재', 8],
      ['로맨스', 0],
      ['힐링', 5],
      ['성장물', 6],
      ['복수', 5],
    ])

    assert.deepEqual(rankTasteTags(counts, 3), [
      ['성장물', 6],
      ['복수', 5],
      ['힐링', 5],
    ])
  })
})
