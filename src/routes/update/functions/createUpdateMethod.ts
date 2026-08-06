import { AppDataSource } from '@/database/datasource';
import {
  DataInfo,
  type NormalizedWebtoon,
  Provider,
  NaverWebtoon,
  KakaoWebtoon,
  KakaoPageWebtoon,
} from '@/database/entity';
import type { Response, Request } from 'express';

interface CreateUpdateMethodProps {
  provider: Exclude<Provider, 'RIDI'>;
  webtoonCrawler: () => Promise<NormalizedWebtoon[]>;
}

const SIX_HOURS = 21_600_000;
const BATCH_SIZE = 100;

export const createUpdateMethod =
  ({ provider, webtoonCrawler }: CreateUpdateMethodProps) =>
  async (_: Request, res: Response) => {
    const dataInfoRepository = AppDataSource.getRepository(DataInfo);

    const dataInfo = await dataInfoRepository.findOneBy({
      provider,
    });

    const updateStartAt =
      dataInfo?.updateStartAt && new Date(dataInfo.updateStartAt);

    const isOld = updateStartAt
      ? new Date().getTime() - updateStartAt.getTime() > SIX_HOURS
      : true;

    if (updateStartAt && !isOld) {
      if (!dataInfo) {
        return res.status(500);
      }

      return res.json({
        ...dataInfo,
        updateRunningTime: dataInfo.updateEndAt
          ? (dataInfo.updateEndAt.getTime() - updateStartAt.getTime()) / 1_000
          : (new Date().getTime() - updateStartAt.getTime()) / 1_000,
      });
    }

    const updatingDataInfo = {
      ...dataInfo,
      provider,
      updateStartAt: new Date(),
      updateEndAt: null,
    };

    await dataInfoRepository.save(updatingDataInfo);

    (async () => {
      const connection = AppDataSource.createQueryRunner();
      await connection.connect();
      await connection.startTransaction();

      try {
        console.log(`🚀 [${provider}] 업데이트 시작`);
        console.time(`${provider}-update`);

        const webtoonList = await webtoonCrawler();

        const EntityTarget = {
          NAVER: NaverWebtoon,
          KAKAO: KakaoWebtoon,
          KAKAO_PAGE: KakaoPageWebtoon,
        }[provider];

        for (let i = 0; i < webtoonList.length; i += BATCH_SIZE) {
          console.log(`🔍 [${provider}] ${i + 1} ~ ${i + BATCH_SIZE} 업데이트`);
          const batch = webtoonList.slice(i, i + BATCH_SIZE);
          await connection.manager.save(EntityTarget, batch);
        }

        // 카카오페이지 실시간 연재 목록 기반 완결작 보정 처리
        if (provider === 'KAKAO_PAGE') {
          const crawledIds = webtoonList.map((w) => w.id);
          if (crawledIds.length > 0) {
            console.log(`🔄 [KAKAO_PAGE] 실시간 연재작 목록에 없는 기존 연재작들을 '완결' 상태로 일괄 전환합니다.`);
            await connection.manager
              .createQueryBuilder()
              .update(KakaoPageWebtoon)
              .set({ isEnd: true })
              .where('isEnd = :isEnd', { isEnd: false })
              .andWhere('id NOT IN (:...crawledIds)', { crawledIds })
              .execute();
          }
        }

        await dataInfoRepository.save({
          ...updatingDataInfo,
          isHealthy: true,
          updateEndAt: new Date(),
        });

        await connection.commitTransaction();

        console.log(`✅ [${provider}] 업데이트 완료`);
        console.timeEnd(`${provider}-update`);
      } catch (err) {
        try {
          if (connection.isTransactionActive) {
            await connection.rollbackTransaction();
          }
        } catch (rollbackErr) {
          console.error(`🚧 [${provider}] 롤백 실패:`, rollbackErr);
        }
        await dataInfoRepository.save({
          ...updatingDataInfo,
          isHealthy: false,
          updateEndAt: new Date(),
        });
        console.error(`🚧 [${provider}] 업데이트 중 오류 발생`);
        console.error(String(err));
      } finally {
        await connection.release();
      }
    })();

    return res.json({
      ...updatingDataInfo,
      updateRunningTime:
        (new Date().getTime() - updatingDataInfo.updateStartAt.getTime()) /
        1_000,
    });
  };
