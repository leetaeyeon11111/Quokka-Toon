import type { Request, Response } from 'express';
import { getToptoonAbout } from '@/modules/toptoon/toptoonApi';

/**
 * @swagger
 * /toptoon/about:
 *   get:
 *     tags: [TOPTOON]
 *     summary: 탑툰 웹툰 상세 정보 및 공식 홈페이지 URL 조회
 *     description: 웹툰 제목을 통해 탑툰의 ID를 찾아내고, 해당 공식 페이지의 메타데이터를 반환합니다.
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: 웹툰 제목 (예 "만고지존")
 *     responses:
 *       200:
 *         description: 조회 성공
 *       400:
 *         description: 파라미터 누락
 */
export const getToptoonAboutHandler = async (req: Request, res: Response) => {
  const { title } = req.query;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ message: 'Title is required.' });
  }

  const result = await getToptoonAbout(title);
  
  if (!result.url || result.url.includes('/search?')) {
    return res.status(404).json({ message: `Cannot find Toptoon detail for title: ${title}` });
  }

  return res.status(200).json(result);
};
