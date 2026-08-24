/**
 * 【테스트 전용】 네이버 크롤링 값 매핑 확인 (DB 연결 없음)
 *
 * 실행:
 *   npx ts-node -r tsconfig-paths/register src/scripts-mysql/testNaver.ts
 *
 * 동작:
 *   - MySQL 연결 안 함 (로컬에서 DB 없이 실행 가능)
 *   - 네이버 크롤러를 실제로 돌려서 목록을 가져옴
 *   - 앞 5개만 webtoon 컬럼 형태로 매핑해서 콘솔 출력
 *   - 태그 API도 실제 호출해서 태그가 오는지 확인
 *   - 아무것도 저장하지 않음
 *
 * ※ 이 파일은 테스트용. 확인 끝나면 updateNaver.ts를 실제 실행하면 됨.
 */

import 'reflect-metadata';
import { getNaverWebtoonList } from '../modules/naver';
import { getNaverWebtoonInfo } from '../modules/naver/functions/naverApi';
import {
  PLATFORM_NAME_MAP,
  SOURCE_MAP,
  toAgeRating,
  toPublishDay,
  toThumbnailUrl,
  toSourceKey,
  toSerialStatus,
  normalizeForCompare,
  parseAuthors
} from './mapper';

const PROVIDER = 'NAVER';
const PLATFORM_NAME = PLATFORM_NAME_MAP[PROVIDER]; // '네이버웹툰'
const SOURCE = SOURCE_MAP[PROVIDER]; // 'naver'
const SAMPLE_COUNT = 5;

async function main() {
  console.info(`\n🧪 [테스트] 네이버 매핑 확인 (DB 저장 안 함)\n`);

  // 크롤링 (실제 실행)
  console.info('⌛️ 네이버 목록 크롤링 중...');
  const webtoonList = await getNaverWebtoonList();
  console.info(`📥 크롤링된 전체: ${webtoonList.length}건`);
  console.info(`🔍 앞 ${SAMPLE_COUNT}개만 매핑 확인:\n`);

  const sample = webtoonList.slice(0, SAMPLE_COUNT);

  for (let i = 0; i < sample.length; i++) {
    const w = sample[i];
    const sourceKey = toSourceKey(w.id);

    const mapped = {
      source: SOURCE,
      source_key: sourceKey,
      title: w.title,
      product_name: w.title,
      platform_name: PLATFORM_NAME,
      thumbnail_url: toThumbnailUrl(w.thumbnail),
      external_url: w.url || '',
      age_rating: toAgeRating(w.ageGrade),
      serial_status: toSerialStatus(w.isEnd),
      is_completed: w.isEnd ? 1 : 0,
      publish_day: toPublishDay(w.updateDays),
    };

    // 태그 실제 호출
    let tags: string[] = [];
    try {
      const { data } = await getNaverWebtoonInfo(Number(sourceKey));
      tags = (data?.curationTagList || [])
        .map((t: any) => (t?.tagName || '').trim())
        .filter(Boolean);
    } catch (e: any) {
      tags = [`(태그 실패: ${e.message || e})`];
    }

    console.info(`─────────── [${i + 1}] ───────────`);
    console.info(`원본 크롤러 데이터:`);
    console.info(`  id: ${w.id}`);
    console.info(`  title: ${w.title}`);
    console.info(`  provider: ${w.provider}`);
    console.info(`  ageGrade: ${w.ageGrade}`);
    console.info(`→ 작가: ${JSON.stringify(parseAuthors(w.authors))}`);
    console.info(`→ 장르(첫태그): ${tags[0] || '(없음)'}`);
    console.info(`  updateDays: ${JSON.stringify(w.updateDays)}`);
    console.info(`  thumbnail: ${JSON.stringify(w.thumbnail)}`);
    console.info(`  url: ${w.url}`);
    console.info(`  isEnd: ${w.isEnd}`);
    console.info(`\n→ webtoon 테이블 매핑 결과:`);
    for (const [k, v] of Object.entries(mapped)) {
      console.info(`  ${k}: ${JSON.stringify(v)}`);
    }
    console.info(`\n→ 태그 (${tags.length}개): ${JSON.stringify(tags)}`);
    console.info(`  (공백제거 중복키: "${normalizeForCompare(w.title)}")\n`);
  }

  console.info('✅ 테스트 완료 (DB에 아무것도 저장하지 않음)');
}

main().catch((err) => {
  console.error('💥 테스트 실패:', err);
  process.exit(1);
});