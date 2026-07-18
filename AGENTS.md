# AGENTS.md

Guidance for anyone (human or agent) working on this repo. Aliased as `CLAUDE.md`.

## What this is

The public Sizlon marketing site: a **static** Astro site, **bilingual**
(English default + Korean), deployed to GitHub Pages at
[sizlon.io](https://sizlon.io). No SSR, no database — output is plain HTML/CSS
with a little inline JS. See `README.md` for the file-tree overview.

## Dev / build / verify

```
npm run dev      # local dev server at localhost:4321
npm run build    # static build to ./dist/  (22 routes today)
npm run preview  # serve the built ./dist/ locally
```

When starting the dev server here, use background mode: `astro dev --background`,
and manage it with `astro dev stop` / `status` / `logs`.

**Verify changes with `npm run build`** and inspect the emitted files under
`dist/` (e.g. `dist/contact/index.html`). The build is the source of truth for
what ships — grep the output to confirm a change rendered on both the en page
and its `dist/ko/...` counterpart.

## Content & i18n — the core convention

**All copy lives in `src/i18n/content.ts`, keyed by locale (`en`, `ko`).** Markup
stays language-free: pages and sections read `content[lang]` via `t(lang)` from
`src/i18n/utils.ts`. When you add or change a user-facing string:

- Add it to **both** `en` and `ko`. A missing key breaks the typed `as const`
  content object.
- Keep product/proper nouns (Crawler Platform, Miriboa, Postgres, …) in English
  in both locales.
- Routing: en at the root, ko under `/ko`. Every page has an en and a ko variant.
  Use `localizePath` / `logicalPath` (utils) for locale-aware hrefs.

## Structure & where things go

- `src/config/site.ts` — the single config/coupling point: `nav`, `crawlerPages`,
  the product list (`solutions[]`), and the contact-form/Turnstile keys.
- `src/pages/**` — thin route files that just render a section (en at root, ko
  mirror under `src/pages/ko/**`).
- `src/sections/**` — the actual page bodies.
- `src/components/**` — shared chrome (`Nav`, `Footer`, `SolutionCard`, …).
- `src/layouts/Base.astro` — the html shell + `<head>` meta.

**Adding a page:** create a section, then thin en + ko page files that render it;
wire nav/product entries in `site.ts` and copy in `content.ts` (both locales).

## Products & navigation

The company umbrella is *AI proposes, a deterministic layer verifies* — product-
neutral. Products live in `solutions[]` (Crawler Platform, Miriboa, Verify) and
each has a `/products/<slug>` page. Crawler-specific pages (How it works,
Security, Editions) are **scoped under Crawler Platform** (`crawlerPages`), not
in the global nav. Keep that split when adding product-specific pages.

## Contact form

The contact form fetch-POSTs to the site backend at `svc.sizlon.io/api/contact`
(source: **sizlon-platform repo, `site-backend/`** — runs in the portal-stack
compose on the vendor host). It verifies Cloudflare Turnstile server-side,
stores submissions, and emails hello@sizlon.io. This repo owns only the form UI
(`src/sections/Contact.astro`) and the endpoint/site-key in `src/config/site.ts`;
backend changes happen in sizlon-platform. (The previous Google Apps Script
backend was retired 2026-07-18.)

## Gotchas

- **Scoped styles vs `[hidden]`:** Astro-scoped CSS beats the UA
  `[hidden]{display:none}` rule, so an element that has both a `display` rule and
  the `hidden` attribute stays visible. Add a scoped
  `[hidden]{display:none!important}` when you toggle visibility via the attribute.
- **External scripts:** use `<script is:inline src="…">` so Astro leaves a CDN
  script untouched (e.g. the Turnstile api.js). There is no CSP on the site.
- **New UI strings must be bilingual** — the `as const` content object fails the
  build if a locale is missing a key.

## Deploy

`deploy.yml` builds and publishes to GitHub Pages on every **push to `main`**
(and manual dispatch). There is no separate release step — merging to `main`
ships the site. (This is a standalone repo; the sizlon-platform monorepo's
manual-CI constraints do not apply here.)

## Astro reference

Full docs: https://docs.astro.build — most relevant here:

- [Routing / pages](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Styling](https://docs.astro.build/en/guides/styling/)
- [Internationalization](https://docs.astro.build/en/guides/internationalization/)
