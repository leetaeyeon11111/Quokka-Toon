import axios from 'axios';
import axiosRetry from 'axios-retry';

const toptoonApi = axios.create({
  baseURL: 'https://toptoon.com',
  timeout: 15_000,
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Accept-Language': 'ko-KR,ko;q=0.9',
  },
});

axiosRetry(toptoonApi, {
  retries: 2,
  retryDelay: (retryCount) => retryCount * 2_000,
  retryCondition: axiosRetry.isNetworkOrIdempotentRequestError,
  onRetry: (retry, _, config) => {
    console.warn(`🚧 [TOPTOON] ${config.url} - retry: ${retry}`);
  },
});

// Cache map for Toptoon mappings
interface ToptoonMapping {
  slug: string;
  title: string;
}

let mappingTable: ToptoonMapping[] = [];
let mappingExpiry = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hr

export const buildToptoonMappingTable = async (): Promise<ToptoonMapping[]> => {
  if (mappingTable.length > 0 && mappingExpiry > Date.now()) {
    return mappingTable;
  }

  console.info('⌛️ [TOPTOON] Building title→slug mapping table...');

  // Toptoon lists to scrape
  const listUrls = [
    '/weekly',
    '/complete'
  ];

  const allMappings: ToptoonMapping[] = [];

  for (const path of listUrls) {
    try {
      const res = await toptoonApi.get(path);
      const html: string = res.data;

      // Extract slug and title
      const regex = /\/comic\/ep_list\/([^"?'#]+)"[^>]*>[\s\S]*?(?:<p[^>]*class="[^"]*tit[^"]*"[^>]*>|<span[^>]*class="[^"]*tit[^"]*"[^>]*>|alt=")([^"<]+)/gi;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const slug = match[1];
        const title = match[2].trim();
        if (title) {
          allMappings.push({ slug, title });
        }
      }
    } catch (err: any) {
      console.error(`🚧 [TOPTOON] Failed to fetch ${path}: ${err.message}`);
    }
  }

  // Deduplicate by slug
  const unique = Array.from(
    new Map(allMappings.map((m) => [m.slug, m])).values(),
  );

  mappingTable = unique;
  mappingExpiry = Date.now() + CACHE_TTL;

  console.info(`✅ [TOPTOON] Mapping table built: ${unique.length} entries`);
  return unique;
};

const normalizeTitle = (t: string): string =>
  t.replace(/\s+/g, '').toLowerCase().replace(/[^\uAC00-\uD7AFa-z0-9]/g, '');

export const findToptoonSlug = async (title: string): Promise<string | null> => {
  const table = await buildToptoonMappingTable();
  const normalizedQuery = normalizeTitle(title);

  // 1. Exact match in cache
  const exactMatch = table.find((m) => normalizeTitle(m.title) === normalizedQuery);
  if (exactMatch) return exactMatch.slug;

  // 2. Partial match in cache
  const partialMatch = table.find(
    (m) => normalizeTitle(m.title).includes(normalizedQuery) ||
           normalizedQuery.includes(normalizeTitle(m.title)),
  );
  if (partialMatch) return partialMatch.slug;

  // 3. Fallback: Naver search (Good for adult titles that DDG filters)
  try {
    const query = `탑툰 ${title}`;
    const res = await axios.get(`https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = res.data;
    const regex = /href="(https:\/\/toptoon\.com\/comic\/ep_list\/([^"]+))"/gi;
    let match = regex.exec(html);
    if (match) {
      console.info(`✅ [TOPTOON] Found via Naver: ${title} -> ${match[2]}`);
      return match[2];
    }
  } catch (err: any) {
    console.error(`🚧 [TOPTOON] Naver fallback failed for ${title}:`, err.message);
  }

  // 4. Fallback: DuckDuckGo search
  try {
    const query = `site:toptoon.com/comic/ep_list ${title}`;
    const res = await axios.post('https://html.duckduckgo.com/html/', `q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const html = res.data;
    const regex = /href="(https:\/\/toptoon\.com\/comic\/ep_list\/([^"]+))"/gi;
    let match = regex.exec(html);
    if (match) {
      console.info(`✅ [TOPTOON] Found via DDG: ${title} -> ${match[2]}`);
      return match[2];
    }
  } catch (err: any) {
    console.error(`🚧 [TOPTOON] DDG fallback failed for ${title}:`, err.message);
  }

  return null;
};

export interface ToptoonAboutResult {
  url: string;
  description: string | null;
  genre: string | null;
  ogImage: string | null;
}

export const fetchToptoonDetail = async (slug: string): Promise<ToptoonAboutResult | null> => {
  try {
    const res = await toptoonApi.get(`/comic/ep_list/${slug}`, {
      headers: { Accept: 'text/html' },
    });
    const html: string = res.data;

    const getMeta = (property: string): string => {
      const regex = new RegExp(`<meta\\s+(?:property|name)="${property}"\\s+content="([^"]*)"`, 'i');
      const match = html.match(regex);
      return match?.[1] || '';
    };

    let description = getMeta('og:description');
    if (description) {
      description = description.replace(/&quot;/g, '"')
                               .replace(/&amp;/g, '&')
                               .replace(/&lt;/g, '<')
                               .replace(/&gt;/g, '>')
                               .replace(/&#39;/g, "'");
    }

    return {
      url: getMeta('og:url') || `https://toptoon.com/comic/ep_list/${slug}`,
      description,
      ogImage: getMeta('og:image') || null,
      genre: null, // Scrape later if needed
    };
  } catch (err: any) {
    console.error(`🚧 [TOPTOON] Failed to fetch detail for ${slug}:`, err.message);
    return null;
  }
};

export const getToptoonAbout = async (title: string): Promise<ToptoonAboutResult> => {
  const slug = await findToptoonSlug(title);

  if (!slug) {
    return {
      url: `https://toptoon.com/search?keyword=${encodeURIComponent(title)}`,
      description: null,
      genre: null,
      ogImage: null,
    };
  }

  const detail = await fetchToptoonDetail(slug);

  if (!detail) {
    return {
      url: `https://toptoon.com/comic/ep_list/${slug}`,
      description: null,
      genre: null,
      ogImage: null,
    };
  }

  return detail;
};
