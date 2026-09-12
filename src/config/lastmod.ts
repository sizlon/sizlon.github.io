/*
 * sitemap <lastmod> — 페이지별 **카피 최종 수정일** (2026-09-06, SEO 리뷰 8번).
 * 빌드 시각을 전부 박으면 매 배포마다 12페이지가 "오늘 바뀜"이 되어 구글이 lastmod 를
 * 통째로 무시한다 — 그래서 손으로 적는다. 규약: content.ts 에서 어느 페이지의 카피를
 * 고치면 여기 그 경로의 날짜도 같은 커밋에서 올린다(디자인·마크업만 바뀐 건 안 올림).
 * 법적 페이지는 본문에 보이는 `content.ko.legal.updated` 와 같은 값을 유지한다.
 * 경로는 sitemap 의 loc 과 같은 꼴(`/…/`). 여기 없는 경로는 lastmod 없이 나간다.
 */
export const LASTMOD: Record<string, string> = {
  '/': '2026-09-11',   // 09-11 v4 프레임: h1·카드 2단·태그라인
  '/en/': '2026-09-07',   // 09-07 검색 블록 포지셔닝·Case studies 링크
  '/notes/': '2026-09-10',   // 09-10 감리 산출물 노트 추가·lede
  '/en/notes/': '2026-09-07',
  '/services/search/': '2026-09-08',   // 09-07 H1·FAQ 3건·분할 금액·무료 스캔·이 다음에
  '/notes/korean-tokenizer/': '2026-09-07',   // 09-07 동의어 각주(4d3576c, 당시 미갱신) + metaTitle
  '/en/notes/korean-tokenizer/': '2026-09-07',
  '/notes/korean-tables/': '2026-09-06',
  '/en/notes/korean-tables/': '2026-09-06',
  '/services/rtm/': '2026-09-12',   // 09-12 FAQ 감리법인 반론·누구 항목 한 문장·형식 견본 일곱 시트(출력기 산출)
  '/notes/audit-deliverables/': '2026-09-10',
  '/notes/audit-findings/': '2026-09-10',
  '/services/miriboa/': '2026-09-11',   // 09-11 신설(입찰 서류 검증 관문)
  '/services/data/': '2026-09-11',   // 09-11 sub·개찰 매일 수집
  '/work/': '2026-09-11',   // 09-11 기술 문단·미리보아 tag
  '/about/': '2026-09-11',   // 09-11 v4 서비스 넷
  '/engine/': '2026-09-11',   // 09-11 게재 + lede 잣대 문장
  '/founder/': '2026-09-11',   // 09-11 경력 첫 줄
  '/contact/': '2026-09-11',   // 09-11 상황 선택지
  '/legal/terms/': '2026-09-06',
  '/legal/privacy/': '2026-09-06',
  '/legal/licenses/': '2026-09-06',
};
