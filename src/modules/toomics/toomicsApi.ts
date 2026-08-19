import axios from 'axios';
import axiosRetry from 'axios-retry';

// =========================================================================
// Toomics API - 제목으로 ID 검색 → 상세 정보 조회
// =========================================================================

const toomicsApi = axios.create({
  baseURL: 'https://www.toomics.com',
  timeout: 15_000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9',
  },
});

axiosRetry(toomicsApi, {
  retries: 2,
  retryDelay: (retryCount) => retryCount * 2_000,
  retryCondition: axiosRetry.isNetworkOrIdempotentRequestError,
  onRetry: (retry, _, config) => {
    console.warn(`🚧 [TOOMICS] ${config.url} - retry: ${retry}`);
  },
});

// =========================================================================
// Memory Cache
// =========================================================================

interface CacheEntry {
  data: any;
  expiry: number;
}

const toomicsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

const getCached = <T>(key: string): T | null => {
  const entry = toomicsCache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return JSON.parse(JSON.stringify(entry.data)) as T;
  }
  return null;
};

const setCache = (key: string, data: any) => {
  toomicsCache.set(key, {
    data: JSON.parse(JSON.stringify(data)),
    expiry: Date.now() + CACHE_TTL,
  });
};

// =========================================================================
// 1. 투믹스 목록 페이지에서 제목↔ID 매핑 테이블 구축
// =========================================================================

interface ToomicsMapping {
  id: string;
  title: string;
}

// 매핑 테이블 캐시 (서버 수명 동안 유지, 1시간마다 갱신)
let mappingTable: ToomicsMapping[] = [];
let mappingExpiry = 0;

const buildMappingTable = async (): Promise<ToomicsMapping[]> => {
  if (mappingTable.length > 0 && mappingExpiry > Date.now()) {
    return mappingTable;
  }

  console.info('⌛️ [TOOMICS] Building title→ID mapping table...');

  const listUrls = [
    '/webtoon/top100/type/famous',
    '/webtoon/finish/all',
    '/webtoon/weekly',
  ];

  const allMappings: ToomicsMapping[] = [];

  for (const path of listUrls) {
    try {
      const res = await toomicsApi.get(path);
      const html: string = res.data;

      // 패턴: <a href="/webtoon/bridge/type/X/toon/ID"> ... <img alt="제목"> ...
      const regex = /\/toon\/(\d+)"[\s\S]*?<img[^>]*alt="([^"]*)"/gi;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const id = match[1];
        const title = match[2].trim();
        if (title) {
          allMappings.push({ id, title });
        }
      }
    } catch (err: any) {
      console.error(`🚧 [TOOMICS] Failed to fetch ${path}: ${err.message}`);
    }
  }

  // 중복 제거 (id 기준)
  const unique = Array.from(
    new Map(allMappings.map((m) => [m.id, m])).values(),
  );

  mappingTable = unique;
  mappingExpiry = Date.now() + CACHE_TTL;

  console.info(`✅ [TOOMICS] Mapping table built: ${unique.length} entries`);
  return unique;
};

// =========================================================================
// 2. 제목으로 투믹스 ID 찾기
// =========================================================================

const normalizeTitle = (t: string): string =>
  t.replace(/\s+/g, '').toLowerCase().replace(/[^\uAC00-\uD7AFa-z0-9]/g, '');

export const findToomicsId = async (
  title: string,
): Promise<string | null> => {
  const table = await buildMappingTable();
  const normalizedQuery = normalizeTitle(title);

  // 정확히 일치하는 항목 먼저 찾기
  const exactMatch = table.find(
    (m) => normalizeTitle(m.title) === normalizedQuery,
  );
  if (exactMatch) return exactMatch.id;

  // 부분 일치 (제목이 포함되는 경우)
  const partialMatch = table.find(
    (m) => normalizeTitle(m.title).includes(normalizedQuery) ||
           normalizedQuery.includes(normalizeTitle(m.title)),
  );
  if (partialMatch) return partialMatch.id;

  return null;
};

// =========================================================================
// 3. ID로 투믹스 상세 페이지 HTML → OG 태그 파싱
// =========================================================================

export interface ToomicsComicDetail {
  /** 투믹스 공식 URL */
  url: string;
  /** og:title */
  ogTitle: string;
  /** og:description (줄거리) */
  description: string;
  /** og:image (썸네일) */
  ogImage: string;
  /** product:category2 (장르) */
  genre: string;
  /** dable:item_id */
  toonId: string;
}

export const fetchToomicsDetail = async (
  toonId: string,
): Promise<ToomicsComicDetail | null> => {
  const cacheKey = `toomics:detail:${toonId}`;
  const cached = getCached<ToomicsComicDetail>(cacheKey);
  if (cached) return cached;

  try {
    const res = await toomicsApi.get(`/webtoon/episode/toon/${toonId}`, {
      headers: { Accept: 'text/html' },
    });

    const html: string = res.data;

    const getMeta = (property: string): string => {
      const regex = new RegExp(
        `<meta\\s+property="${property}"\\s+content="([^"]*)"`,
        'i',
      );
      const match = html.match(regex);
      return match?.[1] || '';
    };

    const result: ToomicsComicDetail = {
      url: getMeta('og:url') || `https://www.toomics.com/webtoon/episode/toon/${toonId}`,
      ogTitle: getMeta('og:title'),
      description: getMeta('og:description'),
      ogImage: getMeta('og:image'),
      genre: getMeta('product:category2'),
      toonId: getMeta('dable:item_id') || toonId,
    };

    setCache(cacheKey, result);
    console.info(
      `✅ [TOOMICS] Fetched detail for toon/${toonId}: "${result.ogTitle}"`,
    );

    return result;
  } catch (err: any) {
    console.error(
      `🚧 [TOOMICS] Failed to fetch detail for toon/${toonId}:`,
      err.message || err,
    );
    return null;
  }
};

// =========================================================================
// 4. 통합: 한글 제목 → ID 검색 → 상세 정보 반환
// =========================================================================

export interface ToomicsAboutResult {
  /** 투믹스 공식 페이지 URL */
  url: string;
  /** 줄거리 */
  description: string | null;
  /** 장르 */
  genre: string | null;
  /** og:image */
  ogImage: string | null;
  /** 투믹스 내부 ID */
  toonId: string | null;
}

export const getToomicsAbout = async (
  title: string,
): Promise<ToomicsAboutResult> => {
  // Step 1: 매핑 테이블에서 ID 찾기
  const toonId = await findToomicsId(title);

  if (!toonId) {
    // ID를 못 찾으면 투믹스 검색 페이지로 fallback
    return {
      url: `https://www.toomics.com/search/result?keyword=${encodeURIComponent(title)}`,
      description: null,
      genre: null,
      ogImage: null,
      toonId: null,
    };
  }

  // Step 2: 상세 페이지에서 OG 태그 파싱
  const detail = await fetchToomicsDetail(toonId);

  if (!detail) {
    return {
      url: `https://www.toomics.com/webtoon/episode/toon/${toonId}`,
      description: null,
      genre: null,
      ogImage: null,
      toonId,
    };
  }

  return {
    url: detail.url,
    description: detail.description || null,
    genre: detail.genre || null,
    ogImage: detail.ogImage || null,
    toonId: detail.toonId,
  };
};
