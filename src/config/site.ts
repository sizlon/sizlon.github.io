/*
 * Thin shared-meta contract for the marketing site (see DESIGN_DIRECTION.md).
 * The only coupling point to the rest of the monorepo. In a later step these
 * values (portal URL, version) can be generated from build_info() / a shared file.
 */
export const site = {
  name: 'Sizlon',
  tagline: 'AI proposes, a deterministic layer verifies',
  portalLoginUrl: 'https://portal.sizlon.io',
  contactEmail: 'hello@sizlon.io',
  // Contact form endpoint — a Google Apps Script web-app /exec URL. Paste the
  // deployed URL here to activate the form; while empty, the form no-ops on
  // submit and the mailto fallback carries. Not a secret (it's client-visible).
  contactFormEndpoint: 'https://script.google.com/macros/s/AKfycbwJ0qPfptzdPshTQ5wEjMSjshp_31toeRyLD7oxIcEOPLwy94OlvmQEBR9n7qAh4JfW/exec',
  // Cloudflare Turnstile site key (public). Set this AND the TURNSTILE_SECRET
  // script property in Apps Script to activate bot verification. While empty,
  // the widget is not rendered and the server skips the Turnstile check.
  turnstileSiteKey: '0x4AAAAAADzkjelT6SU8nIio',
};

// Global nav — product-neutral only. How it works / Security / Editions describe
// Crawler Platform specifically, so they live under that product (see crawlerPages),
// not in the company-level nav. Hrefs/keys are language-neutral; labels come from content[lang].
export const nav = [
  { href: '/products', key: 'Products' },
  { href: '/contact', key: 'Contact' },
] as const;

// Crawler Platform's own sub-pages. Surfaced from the crawler product page and
// the footer — scoped under the product rather than the global nav. The routes
// stay top-level; only their placement in navigation is scoped.
export const crawlerPages = [
  { href: '/how-it-works', key: 'How it works' },
  { href: '/security', key: 'Security' },
  { href: '/editions', key: 'Editions' },
] as const;

// The product line. `categoryKey` labels the domain (product-neutral — the
// company umbrella is the shared "propose then verify" DNA, not one lifecycle).
export type Solution = {
  slug: 'crawler-platform' | 'miriboa' | 'verify';
  name: string; // product name — same in every locale
  categoryKey: 'extraction' | 'verification' | 'quality';
  status: 'live' | 'pilot' | 'next' | 'roadmap';
  href?: string;
};

export const solutions: Solution[] = [
  { slug: 'crawler-platform', name: 'Crawler Platform', categoryKey: 'extraction', status: 'live', href: '/products/crawler-platform' },
  { slug: 'miriboa', name: 'Miriboa', categoryKey: 'verification', status: 'pilot', href: '/products/miriboa' },
  { slug: 'verify', name: 'Verify', categoryKey: 'quality', status: 'roadmap' },
];

export const legalLinks = [
  { href: '/legal/terms', key: 'Terms' },
  { href: '/legal/privacy', key: 'Privacy' },
  { href: '/legal/licenses', key: 'Licenses' },
] as const;
