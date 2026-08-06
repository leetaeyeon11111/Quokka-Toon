# 🚀 Quokka Toon API (쿼카툰 백엔드 API 서버)

> 국내 주요 웹툰 플랫폼(네이버, 카카오, 카카오페이지 등)의 메타데이터를 통합하여 수집 및 캐싱 제공하는 Express/TypeScript 기반의 백엔드 서비스입니다.

---

## 🌟 주요 기능
* **플랫폼 통합 제공**: 네이버웹툰, 카카오웹툰, 카카오페이지의 실시간 데이터를 데이터베이스(SQLite)에 정제 및 일치화하여 적재합니다.
* **주기적 크롤링 스케줄링**: 6시간 간격으로 자동 스크러버(Scrubber)가 기동되어 신규 웹툰, 회차, 업데이팅 유무 등을 실시간 갱신합니다.
* **REST & GraphQL 통합**: 일반적인 API 요청뿐만 아니라 GraphQL 인터페이스를 통하여 프론트엔드가 필요한 컬럼만 가볍게 페치할 수 있도록 설계되었습니다.

---

## 🚀 시작하기 (로컬 실행 방법)

### 1. 패키지 설치
프로젝트 루트 디렉토리에서 라이브러리를 설치합니다.
```bash
npm install
```

### 2. 환경변수 설정 (`.env`)
프로젝트 폴더 아래에 `.env` 파일을 생성하고 필요한 변수를 적어줍니다. (보안상의 이유로 이 파일은 깃 커밋에서 자동 제외됩니다.)
```env
PORT=3000
DATABASE_URL=sqlite://database.sqlite
```

### 3. 개발 서버 기동
로컬 Node.js/TypeScript 컴파일러 및 Express 서버를 실행합니다.
```bash
npm run dev
```
기본 설정 시 API 및 GraphQL 서버는 `http://localhost:3000` 에서 실행되며, Swagger 문서 및 스케줄러가 백그라운드에서 동작을 시작합니다.

---

## 🛠️ 기술 스택
* **Runtime**: Node.js, TypeScript
* **Web Framework**: Express, Apollo Server (GraphQL)
* **Database / ORM**: SQLite, TypeORM
* **Task Scheduler**: node-cron (6시간 간격 자동 동기화)
