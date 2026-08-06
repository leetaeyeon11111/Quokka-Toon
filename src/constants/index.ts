export * from './routes';

export const DOMAIN =
  process.env.NODE_ENV === 'production'
    ? 'https://korea-webtoon-api-cc7dda2f0d77.herokuapp.com'
    : 'http://localhost:3000';
