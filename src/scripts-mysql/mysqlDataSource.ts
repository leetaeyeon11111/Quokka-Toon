import 'reflect-metadata';
import { DataSource } from 'typeorm';

/**
 * MySQL 전용 DataSource (크롤링 → 클라우드 MySQL 저장용)
 *
 * - 기존 src/database/datasource.ts(sqlite)와 별개. 이 스크립트 전용.
 * - 라이트세일 인스턴스 "안에서" 실행하는 것을 전제로 host=127.0.0.1.
 *   (같은 서버 안이라 포트를 외부로 열 필요 없음)
 * - 엔티티 없이 raw SQL(query)로만 동작하므로 entities 불필요.
 * - 접속 정보는 .env / 환경변수에서 읽음.
 */
export const MysqlDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  username: process.env.MYSQL_USER || 'quokka',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'quokkatoon',
  charset: 'utf8mb4',
  synchronize: false,
  logging: false,
});