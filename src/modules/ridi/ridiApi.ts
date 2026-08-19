import axios from 'axios';

export interface RidiAboutInfo {
  toonId: string;
  url: string;
  ogImage: string | null;
  description: string | null;
  genre: string | null;
}

const ridiSearchApi = axios.create({
  baseURL: 'https://search-api.ridibooks.com/search',
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
});

const ridiWebApi = axios.create({
  baseURL: 'https://ridibooks.com/books',
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
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
    const res = await ridiSearchApi.get(`?keyword=${encodeURIComponent(cleanTitle)}`);
    const books = res.data?.books || [];
    console.log(`[RIDI] Search returned ${books.length} books`);
    
    // 웹툰 카테고리이거나 제목이 매칭되는 첫번째 항목
    let targetBook = books.find((b: any) => b.is_webtoon || b.webtoon);
    if (!targetBook && books.length > 0) {
      targetBook = books[0];
    }
    
    if (targetBook) {
      const bookId = String(targetBook.b_id);
      console.log(`[RIDI] Found target book ID: ${bookId}, title: ${targetBook.title}`);
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

/**
 * 해당 book_id의 리디 상세 페이지에서 OG 태그(썸네일, 줄거리 등)를 긁어옴
 */
export const fetchRidiDetail = async (bookId: string): Promise<RidiAboutInfo | null> => {
  try {
    const res = await ridiWebApi.get(`/${bookId}`);
    const html: string = res.data;
    
    // CHEERIO 대신 정규식 파싱 사용
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/i);
    const ogDescMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/i);
    const ogImgMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i);
    
    const ogTitle = ogTitleMatch ? ogTitleMatch[1] : null;
    let description = ogDescMatch ? ogDescMatch[1] : null;
    const ogImage = ogImgMatch ? ogImgMatch[1] : null;
    
    // 필요 시 HTML 엔티티 디코딩 (&quot; 등)
    if (description) {
      description = description.replace(/&quot;/g, '"')
                               .replace(/&amp;/g, '&')
                               .replace(/&lt;/g, '<')
                               .replace(/&gt;/g, '>')
                               .replace(/&#39;/g, "'");
    }

    return {
      toonId: bookId,
      url: `https://ridibooks.com/books/${bookId}`,
      ogImage,
      description,
      genre: null, // 리디는 OG 장르가 명확하지 않음
    };
  } catch (err: any) {
    console.error(`🚧 [RIDI] Detail fetch failed for ${bookId}:`, err.message);
    return null;
  }
};
