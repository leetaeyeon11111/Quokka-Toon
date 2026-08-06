import type { NormalizedWebtoon, UpdateDay } from '@/database/entity';
import { getWebtoonList } from './functions/getWebtoonList';
import { getContentHomeOverview, getContentAbout } from './functions/kakaoPageApi';

enum Weekday {
  월 = 'MON',
  화 = 'TUE',
  수 = 'WED',
  목 = 'THU',
  금 = 'FRI',
  토 = 'SAT',
  일 = 'SUN',
}

const LIMIT_QUEUE = 5;

export const getKakaoPageWebtoonList = async (): Promise<
  NormalizedWebtoon[]
> => {
  const webtoonList = await getWebtoonList();

  let queue = 0;

  const results = await Promise.all(
    webtoonList.map(async ({ seriesId, statusBadge }) => {
      if (queue > LIMIT_QUEUE) {
        await new Promise<void>((resolve) =>
          setInterval(() => {
            if (queue <= LIMIT_QUEUE) resolve();
          }, 1_000),
        );
      }
      queue += 1;

      try {
        const { content } = (await getContentHomeOverview(seriesId)).data.data
          .contentHomeOverview;

        let tags: string[] = [content.category, content.subcategory].filter(
          Boolean,
        ) as string[];
        let description: string | null = content.description;

        try {
          const { result } = (await getContentAbout(seriesId)).data;
          if (result.theme_keyword_list?.length) {
            tags = result.theme_keyword_list.map((k) => k.title);
          }
          if (result.description) {
            description = result.description;
          }
        } catch {
          //! about 실패 시 위의 대분류 태그/기존 description 유지
        }

        const updateDays: UpdateDay[] = [];

        Object.keys(Weekday).forEach((key) => {
          const weekdayKor = key as keyof typeof Weekday;

          if (content.pubPeriod?.includes(weekdayKor))
            updateDays.push(Weekday[weekdayKor]);
        });

        const id = `kakopage_${seriesId}`;

        return {
          id,
          provider: 'KAKAO_PAGE',
          title: content.title,
          url: `https://page.kakao.com/content/${seriesId}`,
          updateDays,
          thumbnail: [`https:${content.thumbnail}`],
          isUpdated: statusBadge === 'BadgeUpStatic',
          ageGrade: {
            Nineteen: 19,
            Fifteen: 15,
            All: 0,
          }[content.ageGrade],
          freeWaitHour:
            content.bm === 'PayWaitfree'
              ? content.waitfreePeriodByMinute / 60
              : null,
          isEnd: content.onIssue === 'End',
          isFree: content.bm !== 'Pay',
          authors: content.authors.split(','),
          description,
          tags,
        } as NormalizedWebtoon;
      } catch (err: any) {
        console.error(`🚧 [KAKAO_PAGE] Failed to fetch details for seriesId ${seriesId}:`, err.message || err);
        return null;
      } finally {
        queue -= 1;
      }
    }),
  );

  return results.filter((w): w is NormalizedWebtoon => w !== null);
};
