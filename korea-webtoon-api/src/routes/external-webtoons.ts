import type { Response, Request } from 'express';
import { getExternalWebtoonList, searchExternalWebtoons } from '@/modules/external/external-webtoons';

/**
 * @swagger
 * /external/webtoons:
 *   get:
 *     tags: [ExternalWebtoons]
 *     summary: 만화규장각 전체 웹툰 목록 조회 (캐시 적용)
 *     description: 만화규장각 OpenAPI에서 웹툰 전체 목록을 가져옵니다. 1시간 캐싱이 적용됩니다.
 *     responses:
 *       200:
 *         description: 전체 웹툰 목록
 *       502:
 *         description: 외부 OpenAPI 연동 실패
 */
export const getExternalWebtoons = async (req: Request, res: Response) => {
  try {
    const list = await getExternalWebtoonList();
    return res.json(list);
  } catch (err: any) {
    console.error('🚧 [routes/external-webtoons] Failed to get external webtoon list:', err.message || err);
    return res.status(502).json({ message: 'Bad Gateway - External OpenAPI error.' });
  }
};

/**
 * @swagger
 * /external/search:
 *   get:
 *     tags: [ExternalWebtoons]
 *     summary: 만화규장각 도서 및 웹툰 검색 (캐시 적용)
 *     description: 만화규장각 OpenAPI에서 제공하는 검색 필터를 통해 정보를 조회합니다. 10분 캐싱이 적용됩니다.
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: 도서제목
 *       - in: query
 *         name: isbn
 *         schema:
 *           type: string
 *         description: 국제 표준 도서 번호
 *       - in: query
 *         name: pictrWritrNm
 *         schema:
 *           type: string
 *         description: 그림작가
 *       - in: query
 *         name: sntncWritrNm
 *         schema:
 *           type: string
 *         description: 글작가
 *       - in: query
 *         name: pltfomCdNm
 *         schema:
 *           type: string
 *         description: 플랫폼명
 *       - in: query
 *         name: plscmpnIdNm
 *         schema:
 *           type: string
 *         description: 출판사명
 *       - in: query
 *         name: pageNo
 *         schema:
 *           type: integer
 *         description: 현재 페이지번호
 *       - in: query
 *         name: viewItemCnt
 *         schema:
 *           type: integer
 *         description: 표시 항목 수
 *     responses:
 *       200:
 *         description: 검색된 웹툰 및 도서 목록
 *       502:
 *         description: 외부 OpenAPI 연동 실패
 */
export const searchExternalWebtoonsHandler = async (req: Request, res: Response) => {
  try {
    const {
      title,
      isbn,
      pictrWritrNm,
      sntncWritrNm,
      pltfomCdNm,
      plscmpnIdNm,
      pageNo,
      viewItemCnt,
    } = req.query;

    const searchParams = {
      title: title ? String(title) : undefined,
      isbn: isbn ? String(isbn) : undefined,
      pictrWritrNm: pictrWritrNm ? String(pictrWritrNm) : undefined,
      sntncWritrNm: sntncWritrNm ? String(sntncWritrNm) : undefined,
      pltfomCdNm: pltfomCdNm ? String(pltfomCdNm) : undefined,
      plscmpnIdNm: plscmpnIdNm ? String(plscmpnIdNm) : undefined,
      pageNo: pageNo ? Number(pageNo) : undefined,
      viewItemCnt: viewItemCnt ? Number(viewItemCnt) : undefined,
    };

    const list = await searchExternalWebtoons(searchParams);
    return res.json(list);
  } catch (err: any) {
    console.error('🚧 [routes/external-webtoons] Failed to search external webtoons:', err.message || err);
    return res.status(502).json({ message: 'Bad Gateway - External OpenAPI error.' });
  }
};
