/**
 * 카카오페이지 최신 웹툰 → 클라우드 MySQL 저장 스크립트
 *
 * 실행 (라이트세일 인스턴스 안에서):
 *   npx ts-node -r tsconfig-paths/register src/scripts-mysql/updateKakaoPage.ts
 *
 * 흐름:
 *   1) getKakaoPageWebtoonList()로 목록 수집 (★ 이 크롤러는 tags까지 이미 포함)
 *   2) product_name(=title)+platform_name 공백제거 비교로 중복 체크
 *      - 이미 있으면 → 완전 건너뜀
 *      - 없으면 → webtoon INSERT + 크롤러가 준 tags를 tag/webtoon_tag에 저장
 *
 * 네이버/카카오와 다른 점:
 *   - 카카오페이지 크롤러는 목록 단계에서 이미 태그를 가져오므로,
 *     별도 상세 태그 API 호출이 필요 없음. w.tags를 바로 사용.
 */

import 'reflect-metadata';
import { MysqlDataSource } from './mysqlDataSource';
import { getKakaoPageWebtoonList } from '../modules/kakao-page'; // 기존 크롤러 (경로 확인)
import {
  PLATFORM_NAME_MAP,
  SOURCE_MAP,
  toAgeRating,
  toPublishDay,
  toThumbnailUrl,
  toSourceKey,
  toSerialStatus,
  normalizeForCompare,
  parseAuthors,
} from './mapper';

const PROVIDER = 'KAKAO_PAGE';
const PLATFORM_NAME = PLATFORM_NAME_MAP[PROVIDER]; // '카카오페이지'
const SOURCE = SOURCE_MAP[PROVIDER]; // 'kakaopage'
const TAG_SOURCE = 'kakaopage';

const DELAY_MS = 300; // 크롤러가 이미 태그를 가져왔으므로 추가 API 호출 없음 → 짧게
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loadExistingNames(): Promise<Set<string>> {
  const rows: { product_name: string }[] = await MysqlDataSource.query(
    `SELECT product_name FROM webtoon WHERE platform_name = ?`,
    [PLATFORM_NAME],
  );
  const set = new Set<string>();
  for (const r of rows) {
    if (r.product_name) set.add(normalizeForCompare(r.product_name));
  }
  return set;
}

async function upsertTag(manager: any, name: string): Promise<number> {
  await manager.query(
    `INSERT INTO tag (name, usage_count) VALUES (?, 0)
     ON DUPLICATE KEY UPDATE tag_id = LAST_INSERT_ID(tag_id)`,
    [name],
  );
  const r = await manager.query(`SELECT LAST_INSERT_ID() AS id`);
  return Number(r[0].id);
}

// 작가 확보 (author 테이블) → author_id
async function upsertAuthor(manager: any, name: string): Promise<number> {
  await manager.query(
    `INSERT INTO author (name) VALUES (?)
     ON DUPLICATE KEY UPDATE author_id = LAST_INSERT_ID(author_id)`,
    [name],
  );
  const r = await manager.query(`SELECT LAST_INSERT_ID() AS id`);
  return Number(r[0].id);
}

// 장르 확보 (genre 테이블) → genre_id
async function upsertGenre(manager: any, name: string): Promise<number> {
  await manager.query(
    `INSERT INTO genre (name) VALUES (?)
     ON DUPLICATE KEY UPDATE genre_id = LAST_INSERT_ID(genre_id)`,
    [name],
  );
  const r = await manager.query(`SELECT LAST_INSERT_ID() AS id`);
  return Number(r[0].id);
}

async function main() {
  await MysqlDataSource.initialize();
  console.info('✅ MySQL 연결됨');

  const chk = await MysqlDataSource.query(`SELECT COUNT(*) AS c FROM webtoon`);
  console.info(`ℹ️  webtoon 테이블 확인 (총 ${chk[0].c}건)`);

  console.info('⌛️ 카카오페이지 목록 크롤링 시작... (태그 포함, 다소 걸림)');
  const webtoonList = await getKakaoPageWebtoonList();
  console.info(`📥 크롤링된 카카오페이지 웹툰: ${webtoonList.length}건`);

  const existingNames = await loadExistingNames();
  console.info(`🗂️  기존 MySQL 카카오페이지 웹툰: ${existingNames.size}건`);

  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  let tagInserted = 0;
  let genreInserted = 0;
  let authorInserted = 0;
  let failed = 0;

  for (const w of webtoonList) {
    processed++;
    const title = w.title;
    const prefix = `[${processed}/${webtoonList.length}] "${title}"`;

    const normName = normalizeForCompare(title);
    if (existingNames.has(normName)) {
      skipped++;
      continue;
    }

    try {
      const sourceKey = toSourceKey(w.id); // "kakopage_57925268" → "57925268"

      // 크롤러가 이미 가져온 태그 (# 제거 안전차원)
      const tags: string[] = (w.tags || [])
        .map((t: string) => (t || '').replace(/^#/, '').trim())
        .filter(Boolean);

      await MysqlDataSource.transaction(async (manager) => {
        const insertRes = await manager.query(
          `INSERT INTO webtoon
             (source, source_key, title, product_name, platform_name,
              thumbnail_url, external_url, age_rating, serial_status,
              is_completed, publish_day, summary, collected_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            SOURCE,
            sourceKey,
            title,
            title,
            PLATFORM_NAME,
            toThumbnailUrl(w.thumbnail),
            w.url || '',
            toAgeRating(w.ageGrade),
            toSerialStatus(w.isEnd),
            w.isEnd ? 1 : 0,
            toPublishDay(w.updateDays),
            w.description || null, // 카카오페이지 크롤러는 description도 가져옴
          ],
        );
        const newWebtoonId = insertRes.insertId;

        for (const name of tags) {
          if (name.length > 50) continue;
          const tagId = await upsertTag(manager, name);
          const linkRes = await manager.query(
            `INSERT IGNORE INTO webtoon_tag (webtoon_id, tag_id, source)
             VALUES (?, ?, ?)`,
            [newWebtoonId, tagId, TAG_SOURCE],
          );
          if (linkRes?.affectedRows === 1) tagInserted++;
        }

        // 장르 저장 (첫 번째 태그 = 대표 장르)
        if (tags.length > 0) {
          const genreName = tags[0];
          if (genreName.length <= 50) {
            const genreId = await upsertGenre(manager, genreName);
            await manager.query(
              `INSERT IGNORE INTO webtoon_genre (webtoon_id, genre_id)
               VALUES (?, ?)`,
              [newWebtoonId, genreId],
            );
            await manager.query(
              `UPDATE webtoon SET main_genre_id = ? WHERE webtoon_id = ?`,
              [genreId, newWebtoonId],
            );
            genreInserted++;
          }
        }

        // 작가 저장 (첫=WRITER, 나머지=ARTIST)
        const authorRoles = parseAuthors(w.authors);
        for (const a of authorRoles) {
          if (a.name.length > 100) continue;
          const authorId = await upsertAuthor(manager, a.name);
          const aLinkRes = await manager.query(
            `INSERT IGNORE INTO webtoon_author (webtoon_id, author_id, role)
             VALUES (?, ?, ?)`,
            [newWebtoonId, authorId, a.role],
          );
          if (aLinkRes?.affectedRows === 1) authorInserted++;
        }

        inserted++;
        existingNames.add(normName);
        console.info(`✅ ${prefix} — 신규 추가 (태그 ${tags.length}개)`);
      });
    } catch (err: any) {
      failed++;
      console.error(`🚧 ${prefix} — 에러: ${err.message || err}`);
    }

    await sleep(DELAY_MS);
  }

  console.info('\n════════ 결과 요약 ════════');
  console.info(`크롤링된 웹툰    : ${webtoonList.length}`);
  console.info(`신규 추가       : ${inserted}`);
  console.info(`이미 있어 건너뜀 : ${skipped}`);
  console.info(`태그 연결(행)    : ${tagInserted}`);
  console.info(`장르 지정       : ${genreInserted}`);
  console.info(`작가 연결(행)    : ${authorInserted}`);
  console.info(`실패           : ${failed}`);

  // tag.usage_count 갱신 (실제 webtoon_tag 연결 수로 다시 계산)
  console.info('\n🔄 tag.usage_count 갱신 중...');
  await MysqlDataSource.query(
    `UPDATE tag t SET t.usage_count =
       (SELECT COUNT(*) FROM webtoon_tag wt WHERE wt.tag_id = t.tag_id)`,
  );
  console.info('✅ usage_count 갱신 완료');

  await MysqlDataSource.destroy();
}

main().catch((err) => {
  console.error('💥 스크립트 실패:', err);
  process.exit(1);
});