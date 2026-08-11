import axios from 'axios';
import axiosRetry from 'axios-retry';

const naverApi = axios.create({
  baseURL: 'https://comic.naver.com/api/webtoon/titlelist',
  timeout: 30_000,
});

axiosRetry(naverApi, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 3_000,
  onRetry: (retry, _, config) => {
    console.error(`🚧 [NAVER] ${config.url} - retry: ${retry}`);
  },
});

export interface NaverWebtoonTitle {
  adult: boolean;
  /**
   * @example "채밀/수냥냥/윤쏨 / 서순배 / 윤쏨"
   */
  author: string;
  /**
   * @description 기다리면 무료
   */
  bm: boolean;
  titleName: string;
  up: boolean;
  titleId: number;
  finish: boolean;
  thumbnailUrl: string;
}

export const getDailyPlusWebtoonList = () =>
  naverApi.get<{
    titleList: NaverWebtoonTitle[];
  }>('/weekday?week=dailyPlus&order=user');

export const getweeklyWebtoonList = () => {
  console.info(`⌛️ [NAVER] - 요일별 웹툰 정보 요청`);
  return naverApi.get<{
    titleListMap: {
      FRIDAY: NaverWebtoonTitle[];
      MONDAY: NaverWebtoonTitle[];
      SATURDAY: NaverWebtoonTitle[];
      SUNDAY: NaverWebtoonTitle[];
      THURSDAY: NaverWebtoonTitle[];
      TUESDAY: NaverWebtoonTitle[];
      WEDNESDAY: NaverWebtoonTitle[];
    };
  }>('/weekday?order=user');
};

export const getFinishedWebtoonList = (page: number) => {
  console.info(`⌛️ [NAVER] - 완결 웹툰 정보 요청`);

  return naverApi.get<{
    titleList: NaverWebtoonTitle[];
    pageInfo: { totalPages: number };
  }>(`/finished?page=${page}&order=UPDATE`);
};

export interface NaverWebtoonInfo {
  synopsis: string;
  curationTagList: { tagName: string }[];
}

export const getNaverWebtoonInfo = (titleId: number) => {
  console.info(`⌛️ [NAVER] titleId: ${titleId} - 상세 정보 요청`);
  return naverApi.get<NaverWebtoonInfo>(
    `https://comic.naver.com/api/article/list/info?titleId=${titleId}`,
  );
};
