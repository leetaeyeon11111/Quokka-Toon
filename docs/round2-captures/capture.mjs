/**
 * Round-2 UI capture script (Playwright + Chrome).
 * Usage: node docs/round2-captures/capture.mjs
 * Reads /tmp/round2_creds.env for TOKEN / POST_ID
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('/tmp/pw-round2/node_modules/playwright')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = __dirname
const BASE = 'http://localhost:5173'

function loadCreds() {
  const raw = fs.readFileSync('/tmp/round2_creds.env', 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const i = line.indexOf('=')
    if (i > 0) env[line.slice(0, i)] = line.slice(i + 1)
  }
  return env
}

async function shot(page, name, opts = {}) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: Boolean(opts.fullPage) })
  console.log('saved', name)
}

async function authedPage(browser, token, { simulateBan = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  await context.addInitScript(
    ({ token, simulateBan }) => {
      localStorage.setItem('quakatoon:token', token)
      if (simulateBan) {
        sessionStorage.setItem(
          'quakatoon:ban',
          JSON.stringify({
            banned: true,
            reason: '캡처용',
            durationLabel: '7일',
            expiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
          }),
        )
      }
    },
    { token, simulateBan },
  )
  if (simulateBan) {
    await context.route('**/api/auth/ban-status**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            banned: true,
            reason: '캡처용',
            durationLabel: '7일',
            expiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
          },
        }),
      })
    })
  }
  const page = await context.newPage()
  return { context, page }
}

async function main() {
  const creds = loadCreds()
  if (!creds.TOKEN) throw new Error('TOKEN missing in /tmp/round2_creds.env')

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  })

  // --- Authed session ---
  const { context, page } = await authedPage(browser, creds.TOKEN)

  // 1) Main quick prompts
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const qp = page.locator('[aria-label="추천 검색어 예시"]')
  if (await qp.count()) await qp.scrollIntoViewIfNeeded()
  await shot(page, '01-quick-prompts')

  // 2–3) Hamburger: 북마크 label + scroll
  await page.locator('button[aria-label="메뉴"]').click()
  await page.waitForSelector('#header-menu-panel', { timeout: 5000 })
  await shot(page, '02-hamburger-bookmark-label')
  await page.locator('#header-menu-panel').evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await page.waitForTimeout(250)
  await shot(page, '03-hamburger-scroll')
  await page.locator('button[aria-label="메뉴"]').click().catch(() => {})

  // 4) Bookmarks empty + quokka
  await page.goto(`${BASE}/mypage/favorites`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  await shot(page, '04-bookmarks-empty-quokka', { fullPage: true })

  // 5) Taste empty quokka
  await page.goto(`${BASE}/mypage/taste`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  await shot(page, '05-taste-empty-quokka', { fullPage: true })

  // 6) Life works empty modal
  const lifeBtn = page.getByText('내 인생작', { exact: false }).first()
  if (await lifeBtn.count()) {
    await lifeBtn.click()
    await page.waitForTimeout(500)
    await shot(page, '06-lifeworks-empty-quokka')
    await page.keyboard.press('Escape').catch(() => {})
    const close = page.locator('button[aria-label*="닫"]').first()
    if (await close.count()) await close.click().catch(() => {})
  }

  // 7) Nickname duplicate check — Signup has the same live check UI and is more stable
  await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  // Signup is multi-step; advance to nickname if needed
  const nickField = page.getByPlaceholder('닉네임 (최대 6글자)')
  if (!(await nickField.count())) {
    // try fill email step quickly to reach nick, or click through
    const emailInput = page.locator('input[type="email"]').first()
    if (await emailInput.count()) {
      await emailInput.fill(`round2nick_${Date.now()}@example.com`)
      const dupBtn = page.getByRole('button', { name: /중복 확인/ }).first()
      if (await dupBtn.count()) await dupBtn.click()
      await page.waitForTimeout(600)
      const nextBtns = page.getByRole('button', { name: /다음|계속|확인/ })
      if (await nextBtns.count()) await nextBtns.first().click().catch(() => {})
      await page.waitForTimeout(600)
    }
  }
  // InfoPage path (logged-in): also attempt editable nickname row
  if (!(await nickField.count())) {
    await page.goto(`${BASE}/mypage/info`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: '수정' }).first().click()
    await page.waitForTimeout(400)
    const infoInput = page.locator('input.rounded-full').first()
    if (await infoInput.count()) {
      await infoInput.fill('캡쳐택')
      await page.waitForTimeout(1000)
    }
    await shot(page, '07-nickname-duplicate-check', { fullPage: true })
  } else {
    await nickField.fill('캡쳐택')
    const dup = page.getByRole('button', { name: /중복 확인/ }).last()
    if (await dup.count()) await dup.click()
    await page.waitForTimeout(1000)
    await shot(page, '07-nickname-duplicate-check', { fullPage: true })
  }

  // 8–9) Media mix dedupe
  await page.goto(`${BASE}/webtoons/24122`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const hero = page.getByText('나무위키에서 미디어믹스', { exact: false }).first()
  if (await hero.count()) await hero.scrollIntoViewIfNeeded()
  await shot(page, '08-mediamix-dedupe-hero')
  const section = page.locator('#media-mix')
  if (await section.count()) {
    await section.scrollIntoViewIfNeeded()
    await shot(page, '09-mediamix-section')
  }

  // 10) Board English break-all
  const postId = creds.POST_ID || '28'
  await page.goto(`${BASE}/board/post/${postId}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  await shot(page, '10-board-english-break-all', { fullPage: true })

  // 11) Dialog modal (confirm delete)
  const del = page.getByRole('button', { name: '삭제' }).first()
  if (await del.count()) {
    await del.click()
    await page.waitForTimeout(500)
    await shot(page, '11-dialog-modal')
    // cancel
    const cancel = page.getByRole('button', { name: /취소|닫기/ }).first()
    if (await cancel.count()) await cancel.click()
    else await page.keyboard.press('Escape')
  } else {
    await shot(page, '11-dialog-modal')
  }

  // 15) Bookmark icon on detail
  await page.goto(`${BASE}/webtoons/24122`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  await shot(page, '15-bookmark-icon-detail')

  await context.close()

  // 12) Banned page (session ban payload, no auth required)
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await ctx2.addInitScript(() => {
    sessionStorage.setItem(
      'quakatoon:ban',
      JSON.stringify({
        banned: true,
        reason: '캡처용 테스트 정지 사유',
        durationLabel: '7일',
        expiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
      }),
    )
  })
  const page2 = await ctx2.newPage()
  await page2.goto(`${BASE}/banned`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(600)
  await shot(page2, '12-banned-page', { fullPage: true })
  await ctx2.close()

  // 13–14) Inquiry select arrow + banned exception banner
  const { context: ctx3, page: page3 } = await authedPage(browser, creds.TOKEN, {
    simulateBan: true,
  })
  await page3.goto(`${BASE}/inquiry`, { waitUntil: 'domcontentloaded' })
  await page3.waitForTimeout(1000)
  await shot(page3, '13-inquiry-select-arrow', { fullPage: true })
  await shot(page3, '14-inquiry-banned-exception', { fullPage: true })
  await ctx3.close()

  await browser.close()
  console.log('All captures done →', OUT)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
