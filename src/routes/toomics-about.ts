import type { Request, Response } from 'express';
import { getToomicsAbout } from '@/modules/toomics/toomicsApi';

/**
 * @swagger
 * /toomics/about:
 *   get:
 *     tags: [Toomics]
 *     summary: 투믹스 웹툰 상세 정보 조회 (On-Demand)
 *     description: |
 *       한글 제목으로 투믹스 웹툰을 검색하여 공식 URL, 줄거리, 장르 정보를 반환합니다.
 *       내부적으로 투믹스 목록 페이지에서 제목→ID 매핑을 구축한 뒤, 상세 페이지의 OG 태그를 파싱합니다.
 *       1시간 캐싱이 적용됩니다.
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: 투믹스 웹툰의 한글 제목 (KMAS 데이터의 title)
 *     responses:
 *       200:
 *         description: 투믹스 웹툰 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: 투믹스 공식 URL
 *                 description:
 *                   type: string
 *                   nullable: true
 *                   description: 줄거리
 *                 genre:
 *                   type: string
 *                   nullable: true
 *                   description: 장르
 *                 ogImage:
 *                   type: string
 *                   nullable: true
 *                   description: OG 이미지 URL
 *                 toonId:
 *                   type: string
 *                   nullable: true
 *                   description: 투믹스 내부 ID
 *       400:
 *         description: 잘못된 파라미터
 *       502:
 *         description: 투믹스 연동 실패
 */
export const getToomicsAboutHandler = async (req: Request, res: Response) => {
  const { title } = req.query;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'title 파라미터가 필요합니다.' });
  }

  try {
    const result = await getToomicsAbout(title.trim());
    return res.json(result);
  } catch (err: any) {
    console.error(
      `🚧 [API TOOMICS_ABOUT] Error fetching for title "${title}":`,
      err.message || err,
    );
    return res.status(502).json({ message: 'Bad Gateway - Toomics 연동 실패' });
  }
};
