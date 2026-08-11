import { Entity, Column, PrimaryColumn } from 'typeorm';

export type UpdateDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type Provider = 'KAKAO' | 'NAVER' | 'KAKAO_PAGE' | 'RIDI' | 'KMAS' | 'LEZHIN' | 'TOPTOON' | 'TOOMICS' | 'MRBLUE' | 'BUFFTOON';

@Entity()
export class NormalizedWebtoon {
  @PrimaryColumn()
  id: string;

  @Column()
  title: string;

  @Column()
  provider: Provider;

  @Column('simple-array')
  updateDays: UpdateDay[];

  @Column()
  url: string;

  @Column('simple-array')
  thumbnail: string[];

  @Column({ default: false })
  isEnd: boolean;

  @Column({ default: false })
  isFree: boolean;

  @Column({ default: false })
  isUpdated: boolean;

  @Column()
  ageGrade: number;

  @Column({ nullable: true, type: 'int' })
  freeWaitHour: number | null;

  @Column('simple-array')
  authors: string[];

  @Column({ nullable: true, type: 'text' })
  description?: string | null;

  @Column({ nullable: true, type: 'simple-array' })
  tags?: string[];
}

@Entity()
export class DataInfo {
  @PrimaryColumn()
  provider: Provider;

  @Column({ type: 'datetime' })
  updateStartAt: Date;

  @Column({ nullable: true, type: 'datetime' })
  updateEndAt: Date | null;

  @Column({ default: true })
  isHealthy: boolean;
}

@Entity()
export class NaverWebtoon extends NormalizedWebtoon {}

@Entity()
export class KakaoWebtoon extends NormalizedWebtoon {}

@Entity()
export class KakaoPageWebtoon extends NormalizedWebtoon {}

@Entity({ name: 'webtoons' })
export class DbWebtoon {
  @PrimaryColumn()
  id: number;

  @Column()
  platform: string;

  @Column()
  api_platform: string;

  @Column()
  title: string;

  @Column()
  product_name: string;

  @Column()
  writer: string;

  @Column()
  illustrator: string;

  @Column()
  genre: string;

  @Column()
  outline: string;

  @Column()
  age_grade: string;

  @Column()
  thumbnail_url: string;

  @Column()
  publisher: string;

  @Column()
  isbn: string;

  @Column()
  raw_json: string;

  @Column()
  source_page_no: number;

  @Column()
  collected_at: string;
}
