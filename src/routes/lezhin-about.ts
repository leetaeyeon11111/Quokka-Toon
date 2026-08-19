import type { Request, Response } from 'express';
import { getLezhinAbout } from '@/modules/lezhin/lezhinApi';

/**
 * @swagger
 * /lezhin/about:
 *   get:
 *     tags: [Lezhin]
 *     summary: 레진코믹스 웹툰 상세 정보 조회 (On-Demand)
 *     description: |
 *       한글 제목으로 레진코믹스를 검색하여 공식 URL, 줄거리, 키워드 태그를 반환합니다.
 *       내부적으로 레진코믹스 검색 API로 slug를 찾은 뒤, 공개 HTML 페이지에서 OG 태그와 키워드 태그를 파싱합니다.
 *       30분 캐싱이 적용됩니다.
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: 레진코믹스 웹툰의 한글 제목 (KMAS 데이터의 title)
 *     responses:
 *       200:
 *         description: 레진코믹스 웹툰 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: 레진코믹스 공식 URL
 *                 description:
 *                   type: string
 *                   nullable: true
 *                   description: 줄거리
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 키워드 태그 목록
 *                 ogImage:
 *                   type: string
 *                   nullable: true
 *                   description: 고화질 OG 이미지 URL
 *                 slug:
 *                   type: string
 *                   nullable: true
 *                   description: 레진코믹스 내부 slug
 *       400:
 *         description: 잘못된 파라미터
 *       502:
 *         description: 레진코믹스 연동 실패
 */
export const getLezhinAboutHandler = async (req: Request, res: Response) => {
  const { title } = req.query;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'title 파라미터가 필요합니다.' });
  }

  try {
    const result = await getLezhinAbout(title.trim());
    return res.json(result);
  } catch (err: any) {
    console.error(
      `🚧 [API LEZHIN_ABOUT] Error fetching for title "${title}":`,
      err.message || err,
    );
    return res.status(502).json({ message: 'Bad Gateway - Lezhin 연동 실패' });
  }
};
