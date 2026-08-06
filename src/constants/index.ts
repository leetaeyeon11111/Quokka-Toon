export * from './routes';

export const DOMAIN =
  process.env.RENDER_EXTERNAL_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://quokka-toon-api.onrender.com'
    : 'http://localhost:3000');
