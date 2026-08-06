import type { Request, Response } from 'express';
import { getContentAbout } from '@/modules/kakao-page/functions/kakaoPageApi';

export const getKakaoPageAbout = async (req: Request, res: Response) => {
  const { id } = req.query;

  if (typeof id !== 'string' || !id.startsWith('kakopage_')) {
    return res.status(400).json({ message: 'Invalid id parameter' });
  }

  const seriesIdStr = id.replace('kakopage_', '');
  const seriesId = Number(seriesIdStr);

  if (isNaN(seriesId)) {
    return res.status(400).json({ message: 'Invalid series id' });
  }

  try {
    const { data } = await getContentAbout(seriesId);
    
    if (!data || !data.result) {
      return res.status(502).json({ message: 'Failed to fetch details from provider' });
    }

    const { description, theme_keyword_list } = data.result;

    return res.json({
      description: description ?? null,
      tags: theme_keyword_list?.map((k) => k.title) ?? [],
    });
  } catch (err: any) {
    console.error(`🚧 [API KAKAO_PAGE_ABOUT] Error fetching seriesId ${seriesId}:`, err.message || err);
    return res.status(502).json({ message: 'Bad Gateway' });
  }
};
