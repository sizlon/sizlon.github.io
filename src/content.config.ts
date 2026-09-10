// 콘텐츠 컬렉션 (2026-09-06). `notes` = 서비스 페이지에 매달린 증거 글 — 실측이 있을 때만 쓴다.
// 언어는 경로가 정한다: notes/<slug>.md 는 한국어(/notes/<slug>/), notes/en/<slug>.md 는 영어
// (/en/notes/<slug>/). 같은 slug 면 번역 짝이고 Note.astro 가 hreflang 으로 묶는다.
// 글의 종류는 둘(2026-09-10 오너 결정): ① 실측 노트 — 우리가 잰 것(개발자 입구), ② 정보성 글 — 예상 고객이 검색하는 제도·절차를
// 1차 자료 원문으로 정리한 마케팅 글(PM 입구, 판매 문장 없이 마지막 링크 한 줄). 누구나 쓸 수 있는 튜토리얼은 여전히 안 쓴다(07-26).
// 본문은 마크다운, 메타는 아래 스키마. 카피 규약은
// content.ts 와 같다(숫자는 실험 기록에서만, 금칙어 동일). 글을 추가하면 lastmod.ts 에도 한 줄.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),          // YYYY-MM-DD, 발행일 = lastmod 초기값
    /** 이 글이 증거가 되는 서비스 — 그 페이지가 이 글을 링크한다 */
    service: z.enum(['search', 'rtm', 'data']),
    eyebrow: z.string().default('노트'),
    /** <title> 전용(선택, 2026-09-07). h1 은 title 그대로. 검색 의도어("nori 사용자 사전" 등)를 SERP 제목에만 넣을 때 쓴다. */
    metaTitle: z.string().optional(),
  }),
});

export const collections = { notes };
