// @ts-check
import { defineConfig } from 'astro/config';

// Public Sizlon marketing site. Static output, bilingual (en default + ko).
// https://astro.build/config
export default defineConfig({
  site: 'https://sizlon.io',
  // Legacy product URLs — landing pages moved top-level with function slugs.
  redirects: {
    '/products/miriboa': '/bid-verification',
    '/products/crawler-platform': '/web-crawling',
    '/ko/products/miriboa': '/ko/bid-verification',
    '/ko/products/crawler-platform': '/ko/web-crawling',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko'],
    routing: { prefixDefaultLocale: false },
  },
});
