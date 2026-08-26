# 2회차 UI 수정 캡처 (localhost)

캡처 일시: 2026-08-25  
환경: front `:5173` + backend `:8080` (기존 프로세스 재사용)

Notion「2회차」하위 페이지(업로드 완료):  
https://app.notion.com/p/3c7c520cc0ba817986b7dcfdcdbb937c?pvs=204

로컬 백업도 이 폴더에 있습니다.

## 체크리스트

| # | 항목 | 스크린샷 | 설명 |
|---|------|----------|------|
| 1 | 예시 프롬프트 메인 (`getQuickPrompts`) | `01-quick-prompts.png` | 메인 히어로 하단 추천 검색어 칩 |
| 2 | 즐겨찾기 → 북마크 (햄버거) | `02-hamburger-bookmark-label.png` | 메뉴「내서재」첫 항목이 **북마크** |
| 3 | 햄버거 스크롤 | `03-hamburger-scroll.png` | 메뉴 패널 `overflow-y-auto` / max-height |
| 4 | 북마크 빈 상태 쿼카 | `04-bookmarks-empty-quokka.png` | `/mypage/favorites` 빈 상태 + `/icons/quokka-emoji.png` |
| 5 | 취향 빈 상태 쿼카 | `05-taste-empty-quokka.png` | `/mypage/taste` 빈 상태 쿼카 |
| 6 | 인생작 빈 상태 쿼카 | `06-lifeworks-empty-quokka.png` | 인생작 모달 빈 상태 쿼카 |
| 7 | 닉네임 중복 확인 | `07-nickname-duplicate-check.png` | 마이페이지 InfoPage 실시간 「이미 사용 중」 |
| 8 | 미디어믹스 중복 제거 | `08-mediamix-dedupe-hero.png`, `09-mediamix-section.png` | 전독시(24122) 히어로 OTT 버튼 서비스당 1개 |
| 9 | 게시판 영문 줄바꿈 | `10-board-english-break-all.png` | `break-all`로 긴 영문 제목/본문 줄바꿈 |
| 10 | alert → Dialog | `11-dialog-modal.png` | 게시글 삭제 Confirm Dialog |
| 11 | 벤 → `/banned` | `12-banned-page.png` | 정지 안내 + 문의하기 CTA |
| 12 | 문의 select 화살표 | `13-inquiry-select-arrow.png` | `appearance-none` + 커스텀 화살표 |
| 13 | 벤 시 문의 예외 | `14-inquiry-banned-exception.png` | `/inquiry` 정지 배너 + 문의 가능 |
| 14 | 북마크 아이콘 (상세) | `15-bookmark-icon-detail.png` | 웹툰 상세 BookmarkIcon |

## UI 외 메모

- **AI models local setup**: UI 화면 없음. 로컬에서 Recommend AI(`:8000`) 등 모델/서비스 기동은 개발 환경 설정이며, 이번 캡처 대상이 아님.

## Notion 붙여넣기용 (간단)

```markdown
# 2회차 UI 수정 캡처

## 예시 프롬프트 메인
메인 `getQuickPrompts` 칩
→ 01-quick-prompts.png

## 즐겨찾기 → 북마크
햄버거「북마크」라벨 + BookmarkIcon/BellIcon
→ 02-hamburger-bookmark-label.png / 04-bookmarks-empty-quokka.png / 15-bookmark-icon-detail.png

## 햄버거 스크롤
→ 03-hamburger-scroll.png

## 닉네임 중복 확인 (InfoPage)
→ 07-nickname-duplicate-check.png

## 미디어믹스 중복 제거
→ 08-mediamix-dedupe-hero.png / 09-mediamix-section.png

## alert → Dialog
→ 11-dialog-modal.png

## 빈 상태 쿼카 (북마크/취향/인생작)
→ 04, 05, 06

## 게시판 영문 break-all
→ 10-board-english-break-all.png

## 벤 /banned + 문의 예외
→ 12-banned-page.png / 14-inquiry-banned-exception.png

## 문의 select 화살표
→ 13-inquiry-select-arrow.png

## AI models local setup
(텍스트만) UI 없음 — 로컬 AI 서비스 기동 설정
```

## 재캡처

```bash
# /tmp/round2_creds.env 에 TOKEN=... 필요 (로그인 JWT)
node docs/round2-captures/capture.mjs
# 또는 인라인 스크립트(에이전트 세션에서 사용)
```
