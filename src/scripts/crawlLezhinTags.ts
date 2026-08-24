/**
 * 레진코믹스 태그 크롤링 → 결과 CSV 저장 (DB 연결 없음)
 *
 * 실행:
 *   npx ts-node -r tsconfig-paths/register src/scripts/crawlLezhinTags.ts
 *
 * 입력:
 *   targets_lezhin.csv  (webtoon_id \t title, 탭 구분, 헤더 1줄)
 *
 * 출력:
 *   lezhin_tags_result.csv   (webtoon_id,tag  — 태그마다 한 줄)
 *   lezhin_failed.csv        (webtoon_id,title,reason — 실패/누락 목록)
 *
 * 동작:
 *   1) 입력 CSV를 읽어 대상 목록(webtoon_id, title) 확보
 *   2) 각 제목으로 getLezhinAbout() 호출 → tags[] 수집
 *   3) (webtoon_id, tag) 형태로 결과 CSV에 append
 *   4) 실패/누락은 별도 CSV로 기록
 *   5) 중단 후 재실행 시, 이미 처리한 webtoon_id는 건너뜀 (이어하기)
 */

import * as fs from 'fs';
import * as path from 'path';
import { getLezhinAbout } from '../modules/lezhin/lezhinApi';

// ───────────────────────────────────────────────────────────
// 경로 설정 (필요하면 수정)
// ───────────────────────────────────────────────────────────
const INPUT_CSV = path.resolve(process.cwd(), 'targets_lezhin_retry.csv');
const OUTPUT_CSV = path.resolve(process.cwd(), 'lezhin_tags_result.csv');    // 그대로 (누적)
const FAILED_CSV = path.resolve(process.cwd(), 'lezhin_failed_retry.csv');   // 새 이름

const DELAY_MS = 1500; // 요청 간 딜레이(ms) — 차단 방지
const BATCH_LIMIT = 0; // 0이면 전체. 테스트 시 예: 20

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// CSV 필드 안전 처리 (쉼표/따옴표/개행 포함 시 감싸기)
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

  // 첫 줄이 헤더(webtoon_id\ttitle)면 건너뜀
  const startIdx =
    lines[0]?.toLowerCase().startsWith('webtoon_id') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length < 2) continue;
    const webtoon_id = parts[0].trim();
    const title = parts.slice(1).join('\t').trim(); // 제목에 탭이 있을 경우 대비
    if (webtoon_id && title) targets.push({ webtoon_id, title });
  }
  return targets;
}

// ───────────────────────────────────────────────────────────
// 이어하기: 이미 결과에 있는 webtoon_id 수집
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

  // 이어하기: 이미 처리된 것 제외
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

  // 결과 파일 헤더 (처음 생성 시에만)
  if (!fs.existsSync(OUTPUT_CSV)) {
    fs.writeFileSync(OUTPUT_CSV, 'webtoon_id,tag\n', 'utf-8');
  }
  if (!fs.existsSync(FAILED_CSV)) {
    fs.writeFileSync(FAILED_CSV, 'webtoon_id,title,reason\n', 'utf-8');
  }

  let processed = 0;
  let successCount = 0; // 태그 1개 이상 얻은 웹툰 수
  let tagCount = 0; // 총 태그 줄 수
  let failCount = 0;

  for (const t of targets) {
    processed++;
    const prefix = `[${processed}/${targets.length}] #${t.webtoon_id} "${t.title}"`;

    try {
      const about = await getLezhinAbout(t.title);

      if (!about.slug) {
        fs.appendFileSync(
          FAILED_CSV,
          `${t.webtoon_id},${csvField(t.title)},slug_not_found\n`,
          'utf-8',
        );
        failCount++;
        console.warn(`⏭️  ${prefix} — slug 못 찾음`);
        await sleep(DELAY_MS);
        continue;
      }

      const tags = (about.tags || []).map((s) => s.trim()).filter(Boolean);

      if (tags.length === 0) {
        fs.appendFileSync(
          FAILED_CSV,
          `${t.webtoon_id},${csvField(t.title)},no_tags\n`,
          'utf-8',
        );
        failCount++;
        console.warn(`⏭️  ${prefix} — 태그 0개`);
        await sleep(DELAY_MS);
        continue;
      }

      // (webtoon_id, tag) 형태로 태그마다 한 줄씩 append
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