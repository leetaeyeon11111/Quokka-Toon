import type { Response, Request } from 'express';
import {
  NormalizedWebtoon,
  NaverWebtoon,
  KakaoWebtoon,
  KakaoPageWebtoon,
  Provider,
} from '@/database/entity';
import { AppDataSource } from '@/database/datasource';
import { getNaverWebtoonInfo } from '@/modules/naver/functions/naverApi';
import { getContentProfile } from '@/modules/kakao/functions/kakaoApi';

interface QueryParams {
  keyword?: string;
  provider?: Provider | 'ALL';
  genre?: string;
  page?: number;
  perPage?: number;
  sort?: 'ASC' | 'DESC';
  isUpdated?: boolean;
  isFree?: boolean;
  updateDay?: string;
}

/**
 * @swagger
 * /webtoons:
 *   get:
 *     tags: [Webtoons]
 *     summary: 웹툰 목록 조회
 *     description: 선택적 필터를 사용하여 웹툰 목록을 조회합니다.
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 웹툰 제목 및 작가 검색을 위한 키워드
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [ALL, NAVER, KAKAO, KAKAO_PAGE, LEZHIN, RIDI, TOPTOON, TOOMICS]
 *         description: 웹툰 제공자
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: 웹툰 장르 필터
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호 (페이지네이션)
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 100
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: 정렬 순서
 *       - in: query
 *         name: isUpdated
 *         schema:
 *           type: boolean
 *         description: 업데이트된 웹툰 필터
 *       - in: query
 *         name: isFree
 *         schema:
 *           type: boolean
 *         description: 무료 웹툰 필터
 *       - in: query
 *         name: updateDay
 *         schema:
 *           type: string
 *           enum: [MON, TUE, WED, THU, FRI, SAT, SUN]
 *         description: 웹툰 업데이트 요일 필터
 *     responses:
 *       200:
 *         description: 웹툰 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: 잘못된 파라미터
 *       500:
 *         description: 내부 서버 오류
 */
export const getWebtoons = async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      page = 1,
      perPage = 30,
      provider = 'ALL',
      genre,
      sort = 'ASC',
      isUpdated,
      isFree,
      updateDay,
    } = req.query as unknown as QueryParams;

    if (!['ASC', 'DESC'].includes(sort)) {
      return res.status(400).json({ message: 'Invalid sort' });
    }

    const externalProviders: (Provider | 'ALL')[] = ['LEZHIN', 'RIDI', 'TOPTOON', 'TOOMICS'];
    const validProviders: string[] = ['ALL', 'NAVER', 'KAKAO', 'KAKAO_PAGE', ...externalProviders];

    if (provider && !validProviders.includes(provider)) {
      return res.status(400).json({ message: 'Invalid provider' });
    }

    if (perPage > 100) {
      return res.status(400).json({ message: 'perPage should be less than 100' });
    }

    let webtoons: NormalizedWebtoon[] = [];
    let total = 0;
    let isLastPage = false;

    // A. Querying only from AppDataSource (database.sqlite for Naver, Kakao, KakaoPage)
    const getLocalQueryBuilder = () => {
      const WebtoonEntity = (() => {
        switch (provider) {
          case 'NAVER':
            return NaverWebtoon;
          case 'KAKAO':
            return KakaoWebtoon;
          case 'KAKAO_PAGE':
            return KakaoPageWebtoon;
          default:
            return NormalizedWebtoon; // View mapping
        }
      })();

      const localRepo = AppDataSource.getRepository(WebtoonEntity);
      const qb = localRepo.createQueryBuilder('webtoon');

      if (provider === 'ALL') {
        // Only return Naver, Kakao, KakaoPage from database.sqlite (to exclude external ones)
        qb.andWhere('webtoon.provider IN (:...provs)', { provs: ['NAVER', 'KAKAO', 'KAKAO_PAGE'] });
      }

      if (genre && genre !== '전체') {
        if (genre === '로맨스/순정') {
          qb.andWhere('(webtoon.tags LIKE :genre OR webtoon.tags LIKE :rofan)', { genre: '%로맨스/순정%', rofan: '%로판%' });
        } else if (genre === '액션') {
          qb.andWhere('(webtoon.tags LIKE :action OR webtoon.tags LIKE :martial)', { action: '%액션%', martial: '%무협%' });
        } else {
          qb.andWhere('webtoon.tags LIKE :genre', { genre: `%${genre}%` });
        }
      }

      if (keyword) {
        const normalizedKeyword = keyword.replace(/\s+/g, '').toLowerCase();
        qb.andWhere(
          '(LOWER(REPLACE(webtoon.title, " ", "")) LIKE :keyword OR LOWER(REPLACE(webtoon.authors, " ", "")) LIKE :keyword)',
          { keyword: `%${normalizedKeyword}%` }
        );
      }

      if (typeof isUpdated !== 'undefined') {
        qb.andWhere('webtoon.isUpdated = :isUpdated', { isUpdated: isUpdated ? 1 : 0 });
      }

      if (typeof isFree !== 'undefined') {
        qb.andWhere('webtoon.isFree = :isFree', { isFree: isFree ? 1 : 0 });
      }

      if (updateDay) {
        qb.andWhere('webtoon.updateDays LIKE :updateDay', { updateDay: `%${updateDay}%` });
      }

      return qb;
    };

    // Flow C: Exclusively external requested
    if (provider && externalProviders.includes(provider)) {
      webtoons = [];
      total = 0;
      isLastPage = true;
    }
    // Flow D: Exclusively local requested (NAVER, KAKAO, KAKAO_PAGE)
    else if (provider && provider !== 'ALL') {
      const qb = getLocalQueryBuilder();
      const [dbWebtoons, dbTotal] = await qb
        .orderBy('webtoon.title', sort)
        .skip((+page - 1) * +perPage)
        .take(+perPage)
        .getManyAndCount();

      webtoons = dbWebtoons;
      total = dbTotal;
      isLastPage = page * perPage >= total;
    }
    // Flow E: ALL platforms requested (Naver, Kakao, KakaoPage)
    else {
      const qb = getLocalQueryBuilder();
      const [dbWebtoons, dbTotal] = await qb
        .orderBy('webtoon.title', sort)
        .skip((+page - 1) * +perPage)
        .take(+perPage)
        .getManyAndCount();

      webtoons = dbWebtoons;
      total = dbTotal;
      isLastPage = page * perPage >= total;
    }

    // Lazy load detailed info (description & tags) only for Naver and Kakao DB webtoons on the current page
    await Promise.all(
      webtoons.map(async (webtoon) => {
        if (webtoon.provider !== 'NAVER' && webtoon.provider !== 'KAKAO') {
          return;
        }
        if (webtoon.description !== null && webtoon.description !== undefined) {
          return;
        }

        try {
          if (webtoon.provider === 'NAVER') {
            const titleId = Number(webtoon.id.replace('naver_', ''));
            const { data } = await getNaverWebtoonInfo(titleId);
            webtoon.description = data.synopsis;
            webtoon.tags = data.curationTagList.map((tag) => tag.tagName);

            const repo = AppDataSource.getRepository(NaverWebtoon);
            await repo.update(webtoon.id, {
              description: webtoon.description,
              tags: webtoon.tags,
            });
          } else if (webtoon.provider === 'KAKAO') {
            const kakaoWebtoonId = Number(webtoon.id.replace('kakao_', ''));
            const { data } = await getContentProfile(kakaoWebtoonId);
            webtoon.description = data.data.synopsis;
            webtoon.tags = data.data.seoKeywords.map((k) => k.replace(/^#/, ''));

            const repo = AppDataSource.getRepository(KakaoWebtoon);
            await repo.update(webtoon.id, {
              description: webtoon.description,
              tags: webtoon.tags,
            });
          }
        } catch (err) {
          console.error(`🚧 [ON-DEMAND DETAIL] Failed to fetch details for ${webtoon.id}:`, err);
        }
      })
    );

    return res.json({ webtoons, total, isLastPage });
  } catch (err: any) {
    console.error('🚧 [getWebtoons] Error in dual-datasource controller:', err.message || err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
