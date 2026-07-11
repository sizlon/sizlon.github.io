// @ts-check
import { defineConfig } from 'astro/config';

// Public Sizlon marketing site. Static output, bilingual (en default + ko).
// https://astro.build/config
export default defineConfig({
  site: 'https://sizlon.io',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko'],
    routing: { prefixDefaultLocale: false },
  },
});
