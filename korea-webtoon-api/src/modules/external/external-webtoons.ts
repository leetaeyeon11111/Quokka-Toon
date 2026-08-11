import axios from 'axios';
import axiosRetry from 'axios-retry';
import https from 'https';
import { NormalizedWebtoon, Provider } from '@/database/entity';

// 1. Create https agent to ignore self-signed SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// 2. Create axios instance for KMAS OpenAPI
const kmasApi = axios.create({
  baseURL: 'https://www.kmas.or.kr/openapi/search',
  timeout: 30000,
  httpsAgent,
});

// 3. Configure axios-retry: 3 retries with 2-second interval
axiosRetry(kmasApi, {
  retries: 3,
  retryDelay: () => 2000,
  retryCondition: axiosRetry.isNetworkOrIdempotentRequestError,
  onRetry: (retryCount, error, config) => {
    console.warn(`🚧 [KMAS OpenAPI] Retry #${retryCount} for ${config.url} due to: ${error.message}`);
  },
});

// =========================================================================
// Memory Caching Implementation with Stampede Protection & Stale-on-error
// =========================================================================

interface CacheEntry {
  data: any;
  expiry: number;
}

const cacheMap = new Map<string, CacheEntry>();
const pendingPromises = new Map<string, Promise<any>>();

const withCache = async <T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> => {
  const now = Date.now();
  const cached = cacheMap.get(key);

  // A. Cache Hit and still valid
  if (cached && cached.expiry > now) {
    return JSON.parse(JSON.stringify(cached.data)) as T;
  }

  // B. Cache Stampede Protection: reuse pending promise
  if (pendingPromises.has(key)) {
    return pendingPromises.get(key) as Promise<T>;
  }

  // C. Execute loader and store result
  const promise = loader()
    .then((freshData) => {
      const copy = JSON.parse(JSON.stringify(freshData));
      cacheMap.set(key, { data: copy, expiry: Date.now() + ttlMs });
      pendingPromises.delete(key);
      return freshData;
    })
    .catch((err) => {
      pendingPromises.delete(key);
      // D. Stale-on-error: Return expired cache if available on failure
      if (cached) {
        console.warn(`🚧 [Cache] Loader failed. Returning stale cache for key: ${key}. Error: ${err.message}`);
        return JSON.parse(JSON.stringify(cached.data)) as T;
      }
      throw err;
    });

  pendingPromises.set(key, promise);
  return promise;
};

// =========================================================================
// Normalizer & Mapper
// =========================================================================

const normalizeKmasWebtoon = (item: any, preferredPlatform?: string): NormalizedWebtoon => {
  // Extract authors safely
  const authors: string[] = [];
  const writer = item.sntncWritrNm?.trim();
  const illustrator = item.pictrWritrNm?.trim();
  if (writer) authors.push(writer);
  if (illustrator && illustrator !== writer) {
    authors.push(illustrator);
  }

  // Parse age grade to numeric representation
  let ageGrade = 0;
  const ageStr = item.ageGradCdNm || '';
  if (ageStr.includes('19') || ageStr.includes('18')) {
    ageGrade = 19;
  } else if (ageStr.includes('15')) {
    ageGrade = 15;
  } else if (ageStr.includes('12')) {
    ageGrade = 12;
  }

  const platform = item.pltfomCdNm || '';
  let provider: Provider = 'KMAS' as Provider;

  // Prioritize preferredPlatform to handle multi-platform serialization mapping
  if (preferredPlatform && platform.includes(preferredPlatform)) {
    if (preferredPlatform.includes('레진')) provider = 'LEZHIN' as Provider;
    else if (preferredPlatform.includes('리디')) provider = 'RIDI' as Provider;
    else if (preferredPlatform.includes('탑툰')) provider = 'TOPTOON' as Provider;
    else if (preferredPlatform.includes('투믹스')) provider = 'TOOMICS' as Provider;
  } else {
    if (platform.includes('레진')) {
      provider = 'LEZHIN' as Provider;
    } else if (platform.includes('리디')) {
      provider = 'RIDI' as Provider;
    } else if (platform.includes('탑툰')) {
      provider = 'TOPTOON' as Provider;
    } else if (platform.includes('투믹스')) {
      provider = 'TOOMICS' as Provider;
    }
  }

  const cleanTitle = (item.prdctNm || item.title || 'untitled').trim().replace(/\s+/g, '');
  const cleanAuthor = (authors.join('') || 'author').trim().replace(/\s+/g, '');
  const normalizedId = `kmas_${provider}_${cleanTitle}_${cleanAuthor}`;

  const thumbUrl = item.imageDownloadUrl?.trim();

  return {
    id: normalizedId,
    title: item.prdctNm || item.title || '제목 없음',
    provider,
    description: item.outline || null,
    tags: item.mainGenreCdNm ? [item.mainGenreCdNm] : [],
    authors,
    isEnd: false,
    ageGrade,
    thumbnail: thumbUrl ? [thumbUrl] : [],
    url: thumbUrl || '',
    updateDays: [],
    isFree: false,
    isUpdated: false,
    freeWaitHour: null,
  };
};

// =========================================================================
// Exported Core Functions
// =========================================================================

export const getExternalWebtoonList = async (): Promise<NormalizedWebtoon[]> => {
  const cacheKey = 'all:webtoon';
  const cacheTTL = 60 * 60 * 1000; // 1 Hour

  return withCache<NormalizedWebtoon[]>(cacheKey, cacheTTL, async () => {
    const apiKey = process.env.KMAS_API_KEY;
    if (!apiKey) {
      throw new Error('KMAS_API_KEY is not defined in the environment config.');
    }

    console.info('⌛️ [KMAS OpenAPI] Initiating fast shallow fetch for bookAndWebtoonList...');
    const viewItemCnt = 100;
    const allItems: any[] = [];

    // Crawl only page 0 and 1 (max 200 items) to prevent quota limit and slow startup responses
    for (let pageNo = 0; pageNo < 2; pageNo++) {
      try {
        const res = await kmasApi.get('/bookAndWebtoonList', {
          params: {
            prvKey: apiKey,
            pageNo,
            viewItemCnt,
          },
        });
        const items = res.data?.itemList || res.data?.itemlist || res.data?.result?.itemList || res.data?.result?.itemlist || [];
        if (items.length === 0) break;
        allItems.push(...items);
      } catch (err: any) {
        console.error(`🚧 [KMAS getExternalWebtoonList] Page ${pageNo} fetch error: ${err.message}`);
        break;
      }
    }

    console.info(`✅ [KMAS OpenAPI] Shallow fetch finished. Collected ${allItems.length} raw items.`);
    const mapped = allItems.map(item => normalizeKmasWebtoon(item));
    const unique = Array.from(
      new Map(mapped.map((item) => [item.id, item])).values()
    );
    return unique;
  });
};

interface SearchParams {
  title?: string;
  isbn?: string;
  pictrWritrNm?: string;
  sntncWritrNm?: string;
  pltfomCdNm?: string;
  plscmpnIdNm?: string;
  pageNo?: number;
  viewItemCnt?: number;
}

export const searchExternalWebtoons = async (params: SearchParams): Promise<NormalizedWebtoon[]> => {
  const cacheKey = `search:${JSON.stringify(params)}`;
  const cacheTTL = 10 * 60 * 1000; // 10 Minutes

  return withCache<NormalizedWebtoon[]>(cacheKey, cacheTTL, async () => {
    const apiKey = process.env.KMAS_API_KEY;
    if (!apiKey) {
      throw new Error('KMAS_API_KEY is not defined in the environment config.');
    }

    const platformName = params.pltfomCdNm;
    const requestedCount = params.viewItemCnt || 24;
    const pageNoOffset = params.pageNo || 0;

    let gathered: any[] = [];
    let currentPage = pageNoOffset * 2; // Simple multiplier to match pagination bounds

    console.info(`⌛️ [KMAS searchExternalWebtoons] Gathering items for platform: ${platformName}...`);

    // Fetch up to 3 pages sequentially until we reach requestedCount or EOF
    for (let i = 0; i < 3; i++) {
      const res = await kmasApi.get('/bookAndWebtoonList', {
        params: {
          prvKey: apiKey,
          pltfomCdNm: platformName,
          title: params.title,
          pageNo: currentPage,
          viewItemCnt: 100, // Fetch large bulk to secure matching items quickly
        },
      });

      const items = res.data?.itemList || res.data?.itemlist || res.data?.result?.itemList || res.data?.result?.itemlist || [];
      if (items.length === 0) break;

      // Filter only matching platform items (Strict and non-empty matching)
      const matched = items.filter((item: any) => {
        if (!platformName) return true;
        const plat = (item.pltfomCdNm || '').trim();
        if (!plat) return false; // Exclude empty platform metadata records
        return plat.includes(platformName) || platformName.includes(plat);
      });

      gathered.push(...matched);

      // Stop loop if we gathered enough or reached the end of content
      if (gathered.length >= requestedCount || items.length < 100) {
        break;
      }
      currentPage += 1;
    }

    console.info(`✅ [KMAS searchExternalWebtoons] Gathered ${gathered.length} items. Slicing to ${requestedCount}.`);
    const mapped = gathered.slice(0, requestedCount).map(item => normalizeKmasWebtoon(item, platformName));
    const unique = Array.from(
      new Map(mapped.map((item) => [item.id, item])).values()
    );
    return unique;
  });
};
