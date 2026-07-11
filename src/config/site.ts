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
};

// Nav/legal hrefs and keys are language-neutral; labels come from content[lang].
export const nav = [
  { href: '/products', key: 'Products' },
  { href: '/how-it-works', key: 'How it works' },
  { href: '/security', key: 'Security' },
  { href: '/editions', key: 'Editions' },
  { href: '/contact', key: 'Contact' },
] as const;

// The product line. `categoryKey` labels the domain (product-neutral — the
// company umbrella is the shared "propose then verify" DNA, not one lifecycle).
export type Solution = {
  slug: 'crawler-platform' | 'miriboa' | 'verify';
  name: string; // product name — same in every locale
  categoryKey: 'extraction' | 'verification' | 'quality';
  status: 'live' | 'next' | 'roadmap';
  href?: string;
};

export const solutions: Solution[] = [
  { slug: 'crawler-platform', name: 'Crawler Platform', categoryKey: 'extraction', status: 'live', href: '/products/crawler-platform' },
  { slug: 'miriboa', name: 'Miriboa', categoryKey: 'verification', status: 'next', href: '/products/miriboa' },
  { slug: 'verify', name: 'Verify', categoryKey: 'quality', status: 'roadmap' },
];

export const legalLinks = [
  { href: '/legal/terms', key: 'Terms' },
  { href: '/legal/privacy', key: 'Privacy' },
  { href: '/legal/licenses', key: 'Licenses' },
] as const;
