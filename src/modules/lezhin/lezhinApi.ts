import axios from 'axios';
import axiosRetry from 'axios-retry';

// =========================================================================
// Lezhin Comics API - 검색 및 상세 정보 조회
// =========================================================================

const lezhinApi = axios.create({
  baseURL: 'https://www.lezhin.com',
  timeout: 15_000,
});

axiosRetry(lezhinApi, {
  retries: 2,
  retryDelay: (retryCount) => retryCount * 2_000,
  retryCondition: axiosRetry.isNetworkOrIdempotentRequestError,
  onRetry: (retry, _, config) => {
    console.warn(`🚧 [LEZHIN] ${config.url} - retry: ${retry}`);
  },
});

// =========================================================================
// Memory Cache (동일한 제목 반복 조회 방지)
// =========================================================================

interface CacheEntry {
  data: any;
  expiry: number;
}

const lezhinCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30분

const getCached = <T>(key: string): T | null => {
  const entry = lezhinCache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return JSON.parse(JSON.stringify(entry.data)) as T;
  }
  return null;
};

const setCache = (key: string, data: any) => {
  lezhinCache.set(key, {
    data: JSON.parse(JSON.stringify(data)),
    expiry: Date.now() + CACHE_TTL,
  });
};

// =========================================================================
// 1. 제목으로 Lezhin 검색 → slug(alias) 찾기
// =========================================================================

interface LezhinSearchItem {
  alias: string;
  id: number;
  title: string;
  adult: boolean;
  authors: { id: string; name: string }[];
}

export const searchLezhinByTitle = async (
  title: string,
): Promise<LezhinSearchItem | null> => {
  const cacheKey = `search:${title}`;
  const cached = getCached<LezhinSearchItem>(cacheKey);
  if (cached) return cached;

  try {
    const res = await lezhinApi.get('/lz-api/v2/search', {
      params: { q: title, size: 5, page: 0 },
      headers: {
        'Accept': 'application/json',
        'x-lz-locale': 'ko_KR',
      },
    });

    const sections = res.data?.data?.sections || [];
    const comicSection = sections.find(
      (s: any) => s.type === 'comic',
    );

    if (!comicSection?.items?.length) {
      console.warn(`🚧 [LEZHIN] No search results for: "${title}"`);
      return null;
    }

    // 제목이 정확히 일치하는 항목 우선, 없으면 첫 번째 결과 사용
    const normalizeTitle = (t: string) =>
      t.replace(/\s+/g, '').toLowerCase();
    const normalizedQuery = normalizeTitle(title);

    const exactMatch = comicSection.items.find(
      (item: any) => normalizeTitle(item.title) === normalizedQuery,
    );

    const result: LezhinSearchItem = exactMatch || comicSection.items[0];
    setCache(cacheKey, result);

    return result;
  } catch (err: any) {
    console.error(
      `🚧 [LEZHIN] Search failed for "${title}":`,
      err.message || err,
    );
    return null;
  }
};

// =========================================================================
// 2. slug로 공개 HTML 페이지 fetch → OG 태그 + 키워드 태그 파싱
// =========================================================================

export interface LezhinComicDetail {
  /** 공식 URL (og:url) */
  url: string;
  /** 줄거리 (og:description) */
  description: string;
  /** 고화질 썸네일 (og:image) */
  ogImage: string;
  /** HTML에서 추출한 키워드 태그 목록 (예: ["퀵툰","일상","개그"]) */
  tags: string[];
}

export const fetchLezhinComicDetail = async (
  slug: string,
): Promise<LezhinComicDetail | null> => {
  const cacheKey = `detail:${slug}`;
  const cached = getCached<LezhinComicDetail>(cacheKey);
  if (cached) return cached;

  try {
    const res = await lezhinApi.get(`/ko/comic/${slug}`, {
      headers: {
        'Accept': 'text/html',
        'User-Agent':
          'Mozilla/5.0 (compatible; QuokkaToon/1.0; +https://quokkatoon.example.com)',
      },
    });

    const html: string = res.data;

    // --- OG 태그 파싱 ---
    const getOg = (property: string): string => {
      // property="og:xxx" content="..."  또는  content="..." property="og:xxx" 두 가지 패턴 지원
      const regex = new RegExp(
        `<meta\\s+(?:property="og:${property}"\\s+content="([^"]*?)"|content="([^"]*?)"\\s+property="og:${property}")`,
        'i',
      );
      const match = html.match(regex);
      return match?.[1] || match?.[2] || '';
    };

    const ogUrl = getOg('url') || `https://www.lezhin.com/ko/comic/${slug}`;
    const ogDescription = getOg('description');
    const ogImage = getOg('image');

    // --- 키워드 태그 파싱 ---
    // HTML 패턴: <a href="/ko/tags/..."><button ...>#태그이름</button></a>
    const tagRegex = /href="\/ko\/tags\/[^"]*"[^>]*>[\s\S]*?<button[^>]*>#[\s]*(?:<!--[\s\S]*?-->[\s]*)?([\s\S]*?)<\/button>/gi;
    const tags: string[] = [];
    let tagMatch;
    while ((tagMatch = tagRegex.exec(html)) !== null) {
      const tagText = tagMatch[1]
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim();
      if (tagText && !tags.includes(tagText)) {
        tags.push(tagText);
      }
    }

    const result: LezhinComicDetail = {
      url: ogUrl,
      description: ogDescription,
      ogImage,
      tags,
    };

    setCache(cacheKey, result);
    console.info(
      `✅ [LEZHIN] Fetched detail for "${slug}": ${tags.length} tags, desc=${ogDescription ? 'yes' : 'no'}`,
    );

    return result;
  } catch (err: any) {
    console.error(
      `🚧 [LEZHIN] Failed to fetch comic page for slug "${slug}":`,
      err.message || err,
    );
    return null;
  }
};

// =========================================================================
// 3. 통합: 한글 제목 → slug 검색 → 상세 정보 반환
// =========================================================================

export interface LezhinAboutResult {
  /** 레진코믹스 공식 페이지 URL */
  url: string;
  /** 줄거리 */
  description: string | null;
  /** 키워드 태그 목록 */
  tags: string[];
  /** 고화질 OG 이미지 */
  ogImage: string | null;
  /** Lezhin 내부 slug */
  slug: string | null;
}

export const getLezhinAbout = async (
  title: string,
): Promise<LezhinAboutResult> => {
  // Step 1: 검색으로 slug 찾기
  const searchResult = await searchLezhinByTitle(title);

  if (!searchResult) {
    return {
      url: `https://www.lezhin.com/ko/search?q=${encodeURIComponent(title)}`,
      description: null,
      tags: [],
      ogImage: null,
      slug: null,
    };
  }

  const slug = searchResult.alias;

  // Step 2: 공식 페이지 HTML에서 상세 정보 파싱
  const detail = await fetchLezhinComicDetail(slug);

  if (!detail) {
    return {
      url: `https://www.lezhin.com/ko/comic/${slug}`,
      description: null,
      tags: [],
      ogImage: null,
      slug,
    };
  }

  return {
    url: detail.url,
    description: detail.description || null,
    tags: detail.tags,
    ogImage: detail.ogImage || null,
    slug,
  };
};
