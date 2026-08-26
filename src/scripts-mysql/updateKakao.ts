/**
 * 카카오웹툰 최신 웹툰 → 클라우드 MySQL 저장 스크립트
 *
 * 실행 (라이트세일 인스턴스 안에서):
 *   npx ts-node -r tsconfig-paths/register src/scripts-mysql/updateKakao.ts
 *
 * 흐름:
 *   1) getKakaoWebtoonList()로 카카오 전체 목록 수집
 *   2) product_name(=title)+platform_name 공백제거 비교로 중복 체크
 *      - 이미 있으면 → 완전 건너뜀
 *      - 없으면 → webtoon INSERT + getContentProfile로 태그(seoKeywords) → tag/webtoon_tag
 *
 * 네이버와 다른 점: 크롤러, 태그 API(seoKeywords, # 제거), id 접두사(kakao_)
 */

import 'reflect-metadata';
import { MysqlDataSource } from './mysqlDataSource';
import { getKakaoWebtoonList } from '../modules/kakao'; // 기존 크롤러 (경로 확인)
import { getContentProfile } from '../modules/kakao/functions/kakaoApi'; // 상세 API (경로 확인)
import {
  PLATFORM_ID_MAP,
  SOURCE_MAP,
  toAgeRating,
  toPublishDay,
  toThumbnailUrl,
  toSourceKey,
  toSerialStatus,
  normalizeForCompare,
  parseAuthors,
} from './mapper';

const PROVIDER = 'KAKAO';
const PLATFORM_ID = PLATFORM_ID_MAP[PROVIDER]; // '카카오웹툰'
const SOURCE = SOURCE_MAP[PROVIDER]; // 'kakao'
const TAG_SOURCE = 'kakao';

const DELAY_MS = 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loadExistingNames(): Promise<Set<string>> {
  const rows: { product_name: string }[] = await MysqlDataSource.query(
    `SELECT product_name FROM webtoon WHERE platform_id = ?`,
    [PLATFORM_ID],
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

  console.info('⌛️ 카카오 목록 크롤링 시작...');
  const webtoonList = await getKakaoWebtoonList();
  console.info(`📥 크롤링된 카카오 웹툰: ${webtoonList.length}건`);

  const existingNames = await loadExistingNames();
  console.info(`🗂️  기존 MySQL 카카오 웹툰: ${existingNames.size}건`);

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
      const sourceKey = toSourceKey(w.id); // "kakao_2589" → "2589"
      const contentId = Number(sourceKey);

      await MysqlDataSource.transaction(async (manager) => {
        const insertRes = await manager.query(
          `INSERT INTO webtoon
             (source, source_key, title, product_name, platform_id,
              thumbnail_url, external_url, age_rating, serial_status,
              is_completed, publish_day, collected_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            SOURCE,
            sourceKey,
            title,
            title,
            PLATFORM_ID,
            toThumbnailUrl(w.thumbnail),
            w.url || '',
            toAgeRating(w.ageGrade),
            toSerialStatus(w.isEnd),
            w.isEnd ? 1 : 0,
            toPublishDay(w.updateDays),
          ],
        );
        const newWebtoonId = insertRes.insertId;

        // 태그 가져오기 (seoKeywords, 앞의 # 제거)
        let tags: string[] = [];
        let summary: string | null = null;
        try {
          const { data } = await getContentProfile(contentId);
          tags = (data?.data?.seoKeywords || [])
            .map((k: string) => (k || '').replace(/^#/, '').trim())
            .filter(Boolean);
            summary = data?.data?.synopsis || null;
        } catch (e: any) {
          console.warn(`   ⚠️ 태그 실패: ${e.message || e}`);
        }

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
        // 줄거리 저장
        if (summary) {
          await manager.query(
            `UPDATE webtoon SET summary = ? WHERE webtoon_id = ?`,
            [summary, newWebtoonId],
          );
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