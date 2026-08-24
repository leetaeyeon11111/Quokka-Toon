import axios from 'axios';

export interface RidiAboutInfo {
  toonId: string;
  url: string;
  ogImage: string | null;
  description: string | null;
  genre: string | null;
  tags: string[];
}

const ridiSearchApi = axios.create({
  baseURL: 'https://search-api.ridibooks.com/search',
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0',
  },
});

const ridiWebApi = axios.create({
  baseURL: 'https://ridibooks.com/books',
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0',
  },
});

// Cache for search results: Map<title, bookId>
const searchCache = new Map<string, string>();

/**
 * 리디북스 검색 API를 통해 웹툰 제목으로 book_id를 찾음
 */
export const findRidiId = async (title: string): Promise<string | null> => {
  if (searchCache.has(title)) {
    return searchCache.get(title)!;
  }

  try {
    const cleanTitle = title.trim();
    console.log(`[RIDI] Searching for: ${cleanTitle}`);
    const res = await ridiSearchApi.get(
      `?keyword=${encodeURIComponent(cleanTitle)}`,
    );
    const books = res.data?.books || [];
    console.log(`[RIDI] Search returned ${books.length} books`);

    // 웹툰 카테고리이거나 제목이 매칭되는 첫번째 항목
    let targetBook = books.find((b: any) => b.is_webtoon || b.webtoon);
    if (!targetBook && books.length > 0) {
      targetBook = books[0];
    }

    if (targetBook) {
      const bookId = String(targetBook.b_id);
      console.log(
        `[RIDI] Found target book ID: ${bookId}, title: ${targetBook.title}`,
      );
      searchCache.set(title, bookId);
      return bookId;
    }
    console.log(`[RIDI] Target book not found among ${books.length} books`);
    return null;
  } catch (err: any) {
    console.error(`🚧 [RIDI] Search failed for ${title}:`, err.message);
    return null;
  }
};

// ───────────────────────────────────────────────────────────
// 태그가 아닌 키워드 필터
//   meta keywords 에는 분류/판매정보/작가/출판사가 섞여 있어 걸러냄
// ───────────────────────────────────────────────────────────
const RIDI_STOPWORDS = new Set([
  'ebook',
  '전자책',
  '웹툰',
  '만화',
  '코믹',
  '연재',
  '완결',
  '단행본',
  '기다리면무료',
  '기다무',
  '원작소설有',
  '원작웹소설有',
  '독점',
  '단독',
  '리디',
  '리디북스',
]);

// 작가명/출판사로 추정되는 항목 제거
const isLikelyNotTag = (kw: string): boolean => {
  if (RIDI_STOPWORDS.has(kw)) return true;
  if (/외\s*\d+\s*명/.test(kw)) return true; // "손 외 2명" 같은 작가 표기
  if (/㈜|주식회사|미디어|엔터|스튜디오|컴퍼니|출판|코믹스$/.test(kw)) return true; // 출판사류
  if (/^\d+$/.test(kw)) return true; // 숫자만
  return false;
};

/**
 * 해당 book_id의 리디 상세 페이지에서 OG 태그 + 키워드 태그를 긁어옴
 *   - 태그는 <meta name="keywords" content="a,b,c,..."> 에서 추출 (서버 HTML에 존재)
 */
export const fetchRidiDetail = async (
  bookId: string,
): Promise<RidiAboutInfo | null> => {
  try {
    const res = await ridiWebApi.get(`/${bookId}`);
    const html: string = res.data;

    // --- OG 태그 파싱 ---
    const ogDescMatch = html.match(
      /<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/i,
    );
    const ogImgMatch = html.match(
      /<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i,
    );

    let description = ogDescMatch ? ogDescMatch[1] : null;
    const ogImage = ogImgMatch ? ogImgMatch[1] : null;

    if (description) {
      description = description
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'");
    }

    // --- 태그 파싱: <meta name="keywords" content="a,b,c,..."> ---
    const tags: string[] = [];
    const keywordsMatch = html.match(
      /<meta\s+name="keywords"\s+content="([^"]*)"/i,
    );

    if (keywordsMatch) {
      const raw = keywordsMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'");
      const parts = raw.split(',').map((s) => s.trim());
      for (const kw of parts) {
        if (!kw) continue;
        if (isLikelyNotTag(kw)) continue;
        if (!tags.includes(kw)) tags.push(kw);
      }
    }

    return {
      toonId: bookId,
      url: `https://ridibooks.com/books/${bookId}`,
      ogImage,
      description,
      genre: null, // 리디는 OG 장르가 명확하지 않음
      tags,
    };
  } catch (err: any) {
    console.error(`🚧 [RIDI] Detail fetch failed for ${bookId}:`, err.message);
    return null;
  }
};