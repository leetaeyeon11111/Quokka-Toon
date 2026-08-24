/**
 * 【테스트 전용】 카카오페이지 크롤링 값 매핑 확인 (DB 연결 없음)
 *
 * 실행:
 *   npx ts-node -r tsconfig-paths/register src/scripts-mysql/testKakaoPage.ts
 *
 * 동작:
 *   - MySQL 연결 안 함 (로컬에서 DB 없이 실행 가능)
 *   - 카카오페이지 크롤러를 실제로 돌려서 목록을 가져옴
 *     (★ 이 크롤러는 목록 단계에서 이미 태그를 포함 → w.tags 사용)
 *   - 앞 5개만 webtoon 컬럼 형태로 매핑 + 태그/작가/장르 파싱해서 출력
 *   - 아무것도 저장하지 않음
 *
 * ※ 카카오페이지 크롤러는 각 웹툰마다 상세 API를 호출하므로
 *   5개만 해도 시간이 좀 걸릴 수 있음.
 */

import 'reflect-metadata';
import { getKakaoPageWebtoonList } from '../modules/kakao-page';
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
const SAMPLE_COUNT = 5;

async function main() {
  console.info(`\n🧪 [테스트] 카카오페이지 매핑 확인 (DB 저장 안 함)\n`);

  console.info('⌛️ 카카오페이지 목록 크롤링 중... (태그 포함, 다소 걸림)');
  const webtoonList = await getKakaoPageWebtoonList();
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
      summary: w.description || null,
    };

    // 카카오페이지는 크롤러가 이미 태그를 가져옴 (# 제거 안전차원)
    const tags: string[] = (w.tags || [])
      .map((t: string) => (t || '').replace(/^#/, '').trim())
      .filter(Boolean);

    console.info(`─────────── [${i + 1}] ───────────`);
    console.info(`원본 크롤러 데이터:`);
    console.info(`  id: ${w.id}`);
    console.info(`  title: ${w.title}`);
    console.info(`  provider: ${w.provider}`);
    console.info(`  ageGrade: ${w.ageGrade}`);
    console.info(`  updateDays: ${JSON.stringify(w.updateDays)}`);
    console.info(`  thumbnail: ${JSON.stringify(w.thumbnail)}`);
    console.info(`  url: ${w.url}`);
    console.info(`  isEnd: ${w.isEnd}`);
    console.info(`  authors(원본): ${JSON.stringify(w.authors)}`);
    console.info(`  description: ${(w.description || '').slice(0, 50)}...`);
    console.info(`\n→ webtoon 테이블 매핑 결과:`);
    for (const [k, v] of Object.entries(mapped)) {
      const val =
        typeof v === 'string' && v.length > 60 ? v.slice(0, 60) + '...' : v;
      console.info(`  ${k}: ${JSON.stringify(val)}`);
    }
    console.info(`\n→ 태그 (${tags.length}개): ${JSON.stringify(tags)}`);
    console.info(`→ 장르(첫 태그): ${tags[0] || '(없음)'}`);
    console.info(`→ 작가 파싱: ${JSON.stringify(parseAuthors(w.authors))}`);
    console.info(`  (공백제거 중복키: "${normalizeForCompare(w.title)}")\n`);
  }

  console.info('✅ 테스트 완료 (DB에 아무것도 저장하지 않음)');
}

main().catch((err) => {
  console.error('💥 테스트 실패:', err);
  process.exit(1);
});