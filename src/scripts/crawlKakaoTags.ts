/**
 * 카카오웹툰 태그 크롤링 → 결과 CSV 저장 (DB 쓰기 없음, sqlite는 읽기만)
 *
 * 실행:
 *   npx ts-node -r tsconfig-paths/register src/scripts/crawlKakaoTags.ts
 *
 * 흐름:
 *   1) targets_kakao.csv 읽기 (MySQL 대상: webtoon_id, product_name)
 *   2) sqlite(kakao_webtoon)에서 product_name ↔ title 매칭 → id에서 contentId 추출
 *   3) getContentProfile(contentId) 호출 → seoKeywords 태그 수집
 *   4) (webtoon_id, tag) 형태로 결과 CSV에 append
 *   5) 매칭 실패 / 태그 없음은 별도 CSV로 기록
 *   6) 재실행 시 이미 처리한 webtoon_id는 건너뜀 (이어하기)
 *
 * 입력:  targets_kakao.csv  (webtoon_id \t product_name, 탭 구분, 헤더 1줄)
 * 출력:  kakao_tags_result.csv   (webtoon_id,tag)
 *        kakao_failed.csv        (webtoon_id,product_name,reason)
 */

import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../database/datasource'; // sqlite (읽기 전용)
import { getContentProfile } from '../modules/kakao/functions/kakaoApi'; // ← 실제 경로에 맞게 수정

// ───────────────────────────────────────────────────────────
// 경로 / 설정
// ───────────────────────────────────────────────────────────
const INPUT_CSV = path.resolve(process.cwd(), 'targets_kakao.csv');
const OUTPUT_CSV = path.resolve(process.cwd(), 'kakao_tags_result.csv');
const FAILED_CSV = path.resolve(process.cwd(), 'kakao_failed.csv');

const DELAY_MS = 2000; // 요청 간 딜레이(ms)
const BATCH_LIMIT = 0; // 0이면 전체. 테스트 시 예: 20

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const csvField = (v: string): string => {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
};

const norm = (s: string): string =>
  (s || '').toLowerCase().replace(/[^\uAC00-\uD7AFa-zA-Z0-9]/g, '');

// ───────────────────────────────────────────────────────────
// 입력 CSV 파싱 (탭 구분)
// ───────────────────────────────────────────────────────────
interface Target {
  webtoon_id: string;
  product_name: string;
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
    const product_name = parts.slice(1).join('\t').trim();
    if (webtoon_id) targets.push({ webtoon_id, product_name });
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
// sqlite에서 카카오 title → contentId 맵 구축
//   id 형식: "kakao_2589" → contentId 2589
// ───────────────────────────────────────────────────────────
async function buildContentIdMap(): Promise<{
  exact: Map<string, number>;
  normed: Map<string, number>;
}> {
  const rows: { id: string; title: string }[] = await AppDataSource.query(
    `SELECT id, title FROM kakao_webtoon`,
  );
  const exact = new Map<string, number>();
  const normed = new Map<string, number>();
  for (const r of rows) {
    const m = String(r.id).match(/(\d+)/);
    if (!m) continue;
    const contentId = Number(m[1]);
    if (r.title != null) {
      if (!exact.has(r.title)) exact.set(r.title, contentId);
      const n = norm(r.title);
      if (n && !normed.has(n)) normed.set(n, contentId);
    }
  }
  return { exact, normed };
}

// ───────────────────────────────────────────────────────────
// 메인
// ───────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(INPUT_CSV)) {
    console.error(`💥 입력 파일이 없습니다: ${INPUT_CSV}`);
    process.exit(1);
  }

  await AppDataSource.initialize();
  console.info('✅ sqlite 연결됨 (contentId 매칭용, 읽기 전용)');

  const { exact, normed } = await buildContentIdMap();
  console.info(
    `🗂️  sqlite 카카오 매핑: 정확 ${exact.size}건 / 정규화 ${normed.size}건`,
  );

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
    fs.writeFileSync(FAILED_CSV, 'webtoon_id,product_name,reason\n', 'utf-8');
  }

  let processed = 0;
  let successCount = 0;
  let tagCount = 0;
  let failCount = 0;

  for (const t of targets) {
    processed++;
    const prefix = `[${processed}/${targets.length}] #${t.webtoon_id} "${t.product_name}"`;

    if (!t.product_name || t.product_name.toUpperCase() === 'NULL') {
      fs.appendFileSync(
        FAILED_CSV,
        `${t.webtoon_id},${csvField(t.product_name)},empty_product_name\n`,
        'utf-8',
      );
      failCount++;
      console.warn(`⏭️  ${prefix} — product_name 없음`);
      continue;
    }

    let contentId = exact.get(t.product_name);
    if (contentId === undefined) contentId = normed.get(norm(t.product_name));

    if (contentId === undefined) {
      fs.appendFileSync(
        FAILED_CSV,
        `${t.webtoon_id},${csvField(t.product_name)},no_contentid_in_sqlite\n`,
        'utf-8',
      );
      failCount++;
      console.warn(`⏭️  ${prefix} — sqlite에 contentId 없음`);
      continue;
    }

    try {
      const res = await getContentProfile(contentId);
      const keywords = res.data?.data?.seoKeywords || [];
      const tags = keywords.map((s) => (s || '').trim()).filter(Boolean);

      if (tags.length === 0) {
        fs.appendFileSync(
          FAILED_CSV,
          `${t.webtoon_id},${csvField(t.product_name)},no_tags\n`,
          'utf-8',
        );
        failCount++;
        console.warn(`⏭️  ${prefix} — 태그 0개 (contentId=${contentId})`);
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
        `${t.webtoon_id},${csvField(t.product_name)},${csvField('error:' + (err.message || String(err)))}\n`,
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

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('💥 스크립트 실패:', err);
  process.exit(1);
});