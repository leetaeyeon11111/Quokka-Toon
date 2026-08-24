/**
 * 매핑 테스트 (dry-run) — DB 연결 없이 크롤링 값이 어떻게 매핑되는지 확인
 *
 * 실행:
 *   npx ts-node -r tsconfig-paths/register src/scripts-mysql/testMapping.ts
 *
 * 동작:
 *   - 크롤러를 실제로 돌려서 목록을 가져옴 (앞 N개만)
 *   - 각 웹툰을 webtoon 테이블에 넣을 형태로 매핑
 *   - DB에 넣지 않고 콘솔에 출력만 함
 *   - 네이버/카카오는 태그 API도 실제로 호출해서 태그가 오는지 확인
 *
 * PROVIDER만 바꿔서 3개 플랫폼 각각 테스트 가능
 */

import 'reflect-metadata';
import {
  PLATFORM_NAME_MAP,
  SOURCE_MAP,
  toAgeRating,
  toPublishDay,
  toThumbnailUrl,
  toSourceKey,
  toSerialStatus,
  normalizeForCompare,
} from './mapper.js';

// ───────────────────────────────────────────────────────────
// 여기서 테스트할 플랫폼 선택: 'NAVER' | 'KAKAO' | 'KAKAO_PAGE'
// ───────────────────────────────────────────────────────────
const PROVIDER: 'NAVER' | 'KAKAO' | 'KAKAO_PAGE' = 'NAVER';
const SAMPLE_COUNT = 5; // 앞에서 몇 개만 테스트할지

async function main() {
  const PLATFORM_NAME = PLATFORM_NAME_MAP[PROVIDER];
  const SOURCE = SOURCE_MAP[PROVIDER];

  console.info(`\n🧪 매핑 테스트: ${PROVIDER} (${PLATFORM_NAME})\n`);

  // ── 크롤러 실행 (플랫폼별로 동적 import) ──
  let webtoonList: any[] = [];
  let getTags: ((w: any) => Promise<string[]>) | null = null;

  if (PROVIDER === 'NAVER') {
    const { getNaverWebtoonList } = await import('../modules/naver/index.js');
    const { getNaverWebtoonInfo } = await import(
      '../modules/naver/functions/naverApi.js'
    );
    webtoonList = await getNaverWebtoonList();
    getTags = async (w) => {
      const titleId = Number(toSourceKey(w.id));
      const { data } = await getNaverWebtoonInfo(titleId);
      return (data?.curationTagList || [])
        .map((t: any) => (t?.tagName || '').trim())
        .filter(Boolean);
    };
  } else if (PROVIDER === 'KAKAO') {
    const { getKakaoWebtoonList } = await import('../modules/kakao/index.js');
    const { getContentProfile } = await import(
      '../modules/kakao/functions/kakaoApi.js'
    );
    webtoonList = await getKakaoWebtoonList();
    getTags = async (w) => {
      const contentId = Number(toSourceKey(w.id));
      const { data } = await getContentProfile(contentId);
      return (data?.data?.seoKeywords || [])
        .map((k: string) => (k || '').replace(/^#/, '').trim())
        .filter(Boolean);
    };
  } else {
    const { getKakaoPageWebtoonList } = await import('../modules/kakao-page/index.js');
    webtoonList = await getKakaoPageWebtoonList();
    // 카카오페이지는 크롤러가 이미 태그를 포함 → w.tags 사용
    getTags = async (w) =>
      (w.tags || [])
        .map((t: string) => (t || '').replace(/^#/, '').trim())
        .filter(Boolean);
  }

  console.info(`📥 크롤링된 전체: ${webtoonList.length}건`);
  console.info(`🔍 앞 ${SAMPLE_COUNT}개만 매핑 확인:\n`);

  const sample = webtoonList.slice(0, SAMPLE_COUNT);

  for (let i = 0; i < sample.length; i++) {
    const w = sample[i];

    // webtoon 테이블에 들어갈 형태로 매핑
    const mapped = {
      source: SOURCE,
      source_key: toSourceKey(w.id),
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

    // 태그 가져오기 (실제 API 호출)
    let tags: string[] = [];
    try {
      if (getTags) tags = await getTags(w);
    } catch (e: any) {
      tags = [`(태그 실패: ${e.message || e})`];
    }

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
    console.info(`\n→ webtoon 테이블 매핑 결과:`);
    for (const [k, v] of Object.entries(mapped)) {
      console.info(`  ${k}: ${JSON.stringify(v)}`);
    }
    console.info(`\n→ 태그 (${tags.length}개): ${JSON.stringify(tags)}`);
    console.info(`  (공백제거 중복키: "${normalizeForCompare(w.title)}")\n`);
  }

  console.info('✅ 매핑 테스트 완료 (DB에 아무것도 저장하지 않음)');
}

main().catch((err) => {
  console.error('💥 테스트 실패:', err);
  process.exit(1);
});