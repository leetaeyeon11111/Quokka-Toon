import type { Request, Response } from 'express';
import { findRidiId, fetchRidiDetail } from '@/modules/ridi/ridiApi';

/**
 * @swagger
 * /ridi/about:
 *   get:
 *     tags: [RIDI]
 *     summary: 리디북스 웹툰 상세 정보 및 공식 홈페이지 URL 조회
 *     description: 웹툰 제목을 통해 리디북스의 ID를 찾아내고, 해당 공식 페이지의 메타데이터를 반환합니다.
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: 웹툰 제목 (예 "상수리나무 아래")
 *     responses:
 *       200:
 *         description: 조회 성공
 *       400:
 *         description: 파라미터 누락
 *       404:
 *         description: 리디북스에서 검색되지 않거나 상세 정보를 가져올 수 없음
 */
export const getRidiAboutHandler = async (req: Request, res: Response) => {
  const { title } = req.query;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ message: 'Title is required.' });
  }

  // 1. Title -> Ridi bookId
  const bookId = await findRidiId(title);
  
  if (!bookId) {
    return res.status(404).json({ message: `Cannot find ridi ID for title: ${title}` });
  }

  // 2. Fetch Detail (OG Meta)
  const detail = await fetchRidiDetail(bookId);

  if (!detail) {
    return res.status(404).json({ message: `Cannot fetch details for ridi ID: ${bookId}` });
  }

  return res.status(200).json(detail);
};
