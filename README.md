# sizlon.io — marketing site

Public Sizlon marketing site. Static [Astro](https://astro.build) output,
bilingual (English default + Korean), deployed to GitHub Pages at
[sizlon.io](https://sizlon.io).

Presents Sizlon's products under one umbrella — *AI proposes, a deterministic
layer verifies* — with a page per product (Crawler Platform, Miriboa) and a
working contact form that submits into Sizlon's own Google Workspace.

## Structure

```text
src/
├── pages/        # routes (en at root, ko under /ko); thin — render a section
├── sections/     # page bodies (Home, Product, Miriboa, Contact, Legal, …)
├── components/   # Nav, Footer, SolutionCard, StrategyLadder, …
├── layouts/      # Base.astro (html shell + meta)
├── config/       # site.ts — nav, product list, endpoints, keys
├── i18n/         # content.ts (en + ko copy) + utils
└── styles/       # global.css
contact-form/     # contact-form backend (Google Apps Script) + docs
```

Content lives in `src/i18n/content.ts` so markup stays language-free; pages read
`content[lang]`. See `AGENTS.md` for dev-server notes.

## Documentation

- **[Contact form](contact-form/README.md)** ([한국어](contact-form/README.ko.md)) —
  architecture, configuration, the Apps Script backend, Cloudflare Turnstile
  setup, and troubleshooting for the contact form.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
