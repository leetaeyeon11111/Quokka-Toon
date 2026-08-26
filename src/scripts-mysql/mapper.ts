/**
 * NormalizedWebtoon(크롤러 결과) → MySQL webtoon 테이블 컬럼 매핑 유틸
 */

// 크롤러 provider → platform_id (platform 테이블 기준)
export const PLATFORM_ID_MAP: Record<string, number> = {
  NAVER: 1,        // 네이버웹툰
  KAKAO: 23,       // 카카오웹툰
  KAKAO_PAGE: 2,   // 카카오페이지
};

// 크롤러 provider → webtoon.source (짧은 식별자)
export const SOURCE_MAP: Record<string, string> = {
  NAVER: 'naver',
  KAKAO: 'kakao',
  KAKAO_PAGE: 'kakaopage',
};

// ageGrade 숫자 → age_rating enum('ALL','12','15','19')
export const toAgeRating = (ageGrade: number | null | undefined): string => {
  if (ageGrade === 19) return '19';
  if (ageGrade === 15) return '15';
  if (ageGrade === 12) return '12';
  // 0, null, 그 외 → ALL
  return 'ALL';
};

// updateDays 배열 → publish_day enum (첫 번째만). 없으면 null
export const toPublishDay = (
  updateDays: string[] | undefined | null,
): string | null => {
  if (!updateDays || updateDays.length === 0) return null;
  const first = updateDays[0];
  const valid = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return valid.includes(first) ? first : null;
};

// thumbnail 배열 → thumbnail_url (첫 번째). 없으면 빈 문자열(NOT NULL이므로)
export const toThumbnailUrl = (
  thumbnail: string[] | undefined | null,
): string => {
  if (!thumbnail || thumbnail.length === 0) return '';
  return thumbnail[0] || '';
};

// 크롤러 id ("naver_818791") → source_key ("818791")
export const toSourceKey = (id: string): string => {
  const m = String(id).match(/_(.+)$/);
  return m ? m[1] : String(id);
};

// 공백만 제거한 정규화 (중복 비교용)
export const normalizeForCompare = (s: string): string =>
  (s || '').replace(/\s+/g, '');

// isEnd → serial_status enum
export const toSerialStatus = (isEnd: boolean | undefined): string =>
  isEnd ? 'COMPLETED' : 'ONGOING';

// authors → 역할별 작가 목록
//   규칙: 첫 번째 = WRITER(글), 나머지 = ARTIST(그림)
//   입력은 문자열("히어리,쌍필,사지현") 또는 배열(["히어리","쌍필"]) 둘 다 허용
//   반환: [{ name, role }, ...]  (중복 이름 제거)
export interface AuthorRole {
  name: string;
  role: 'WRITER' | 'ARTIST';
}

export const parseAuthors = (
  authors: string | string[] | null | undefined,
): AuthorRole[] => {
  if (!authors) return [];

  // 배열이면 그대로, 문자열이면 쉼표로 분리
  const list = Array.isArray(authors)
    ? authors
    : String(authors).split(',');

  const names = list.map((s) => (s || '').trim()).filter(Boolean);
  if (names.length === 0) return [];

  // 중복 이름 제거 (순서 유지)
  const uniqueNames: string[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);
    uniqueNames.push(name);
  }

  const result: AuthorRole[] = [];

  // 작가가 1명뿐이면 → 그 사람이 글작가(WRITER)이자 그림작가(ARTIST)
  if (uniqueNames.length === 1) {
    result.push({ name: uniqueNames[0], role: 'WRITER' });
    result.push({ name: uniqueNames[0], role: 'ARTIST' });
    return result;
  }

  // 2명 이상이면 → 첫 번째만 글작가, 나머지는 그림작가
  uniqueNames.forEach((name, idx) => {
    result.push({
      name,
      role: idx === 0 ? 'WRITER' : 'ARTIST',
    });
  });

  return result;
};