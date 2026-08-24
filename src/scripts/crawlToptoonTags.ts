/**
 * 탑툰 태그 크롤링 → 결과 CSV 저장 (DB 연결 없음)
 *
 * 실행:
 *   npx ts-node -r tsconfig-paths/register src/scripts/crawlToptoonTags.ts
 *
 * 입력:
 *   targets_toptoon.csv  (webtoon_id \t title, 탭 구분, 헤더 1줄)
 *
 * 출력:
 *   toptoon_tags_result.csv   (webtoon_id,tag  — 태그마다 한 줄)
 *   toptoon_failed.csv        (webtoon_id,title,reason)
 *
 * 동작:
 *   1) 입력 CSV에서 대상(webtoon_id, title) 확보
 *   2) getToptoonAbout(title) → tags[]
 *   3) (webtoon_id, tag) 형태로 결과 CSV에 append
 *   4) 실패/누락은 별도 CSV로 기록
 *   5) 재실행 시 이미 처리한 webtoon_id는 건너뜀 (이어하기)
 */

import * as fs from 'fs';
import * as path from 'path';
import { getToptoonAbout } from '../modules/toptoon/toptoonApi'; // ← 실제 경로에 맞게 수정

// ───────────────────────────────────────────────────────────
// 경로 / 설정
// ───────────────────────────────────────────────────────────
const INPUT_CSV = path.resolve(process.cwd(), 'targets_toptoon.csv');
const OUTPUT_CSV = path.resolve(process.cwd(), 'toptoon_tags_result.csv');
const FAILED_CSV = path.resolve(process.cwd(), 'toptoon_failed.csv');

const DELAY_MS = 2500; // 요청 간 딜레이(ms) — 탑툰은 네이버/DDG fallback까지 때리므로 넉넉히
const BATCH_LIMIT = 0; // 0이면 전체. 테스트 시 예: 20

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const csvField = (v: string): string => {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
};

// ───────────────────────────────────────────────────────────
// 입력 CSV 파싱 (탭 구분)
// ───────────────────────────────────────────────────────────
interface Target {
  webtoon_id: string;
  title: string;
}

function readTargets(): Target[] {
  const raw = fs.readFileSync(INPUT_CSV, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');
  const targets: Target[] = [];
  const startIdx = lines[0]?.toLowerCase().startsWith('webtoon_id') ? 1 : 0;
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length < 2) continue;
    const webtoon_id = parts[0].trim();
    const title = parts.slice(1).join('\t').trim();
    if (webtoon_id && title) targets.push({ webtoon_id, title });
  }
  return targets;
}

// ───────────────────────────────────────────────────────────
// 이어하기: 이미 처리된 webtoon_id 수집
// ───────────────────────────────────────────────────────────
function loadDoneIds(): Set<string> {
  const done = new Set<string>();
  for (const file of [OUTPUT_CSV, FAILED_CSV]) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const id = line.split(',')[0]?.trim();
      if (id && id !== 'webtoon_id') done.add(id);
    }
  }
  return done;
}

// ───────────────────────────────────────────────────────────
// 메인
// ───────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(INPUT_CSV)) {
    console.error(`💥 입력 파일이 없습니다: ${INPUT_CSV}`);
    process.exit(1);
  }

  let targets = readTargets();
  console.info(`📥 입력 대상: ${targets.length}건`);

  const doneIds = loadDoneIds();
  if (doneIds.size > 0) {
    const before = targets.length;
    targets = targets.filter((t) => !doneIds.has(t.webtoon_id));
    console.info(
      `↩️  이미 처리됨 ${doneIds.size}건 → 남은 대상 ${targets.length}건 (건너뜀 ${before - targets.length})`,
    );
  }

  if (BATCH_LIMIT > 0) {
    targets = targets.slice(0, BATCH_LIMIT);
    console.info(`✂️  테스트 모드: ${targets.length}건만 처리`);
  }

  if (!fs.existsSync(OUTPUT_CSV)) {
    fs.writeFileSync(OUTPUT_CSV, 'webtoon_id,tag\n', 'utf-8');
  }
  if (!fs.existsSync(FAILED_CSV)) {
    fs.writeFileSync(FAILED_CSV, 'webtoon_id,title,reason\n', 'utf-8');
  }

  let processed = 0;
  let successCount = 0;
  let tagCount = 0;
  let failCount = 0;

  for (const t of targets) {
    processed++;
    const prefix = `[${processed}/${targets.length}] #${t.webtoon_id} "${t.title}"`;

    try {
      const about = await getToptoonAbout(t.title);
      const tags = (about?.tags || []).map((s) => s.trim()).filter(Boolean);

      if (tags.length === 0) {
        fs.appendFileSync(
          FAILED_CSV,
          `${t.webtoon_id},${csvField(t.title)},no_tags_or_slug\n`,
          'utf-8',
        );
        failCount++;
        console.warn(`⏭️  ${prefix} — 태그 0개`);
        await sleep(DELAY_MS);
        continue;
      }

      const rows = tags
        .map((tag) => `${t.webtoon_id},${csvField(tag)}`)
        .join('\n');
      fs.appendFileSync(OUTPUT_CSV, rows + '\n', 'utf-8');

      successCount++;
      tagCount += tags.length;
      console.info(`✅ ${prefix} — 태그 ${tags.length}개: ${tags.join(', ')}`);
    } catch (err: any) {
      fs.appendFileSync(
        FAILED_CSV,
        `${t.webtoon_id},${csvField(t.title)},${csvField('error:' + (err.message || String(err)))}\n`,
        'utf-8',
      );
      failCount++;
      console.error(`🚧 ${prefix} — 에러: ${err.message || err}`);
    }

    await sleep(DELAY_MS);
  }

  console.info('\n════════ 결과 요약 ════════');
  console.info(`처리한 웹툰      : ${processed}`);
  console.info(`태그 얻은 웹툰   : ${successCount}`);
  console.info(`총 태그 줄 수    : ${tagCount}`);
  console.info(`실패/누락       : ${failCount}`);
  console.info(`\n결과 파일: ${OUTPUT_CSV}`);
  console.info(`실패 파일: ${FAILED_CSV}`);
}

main().catch((err) => {
  console.error('💥 스크립트 실패:', err);
  process.exit(1);
});