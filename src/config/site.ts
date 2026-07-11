/*
 * Thin shared-meta contract for the marketing site (see DESIGN_DIRECTION.md).
 * The only coupling point to the rest of the monorepo. In a later step these
 * values (portal URL, version) can be generated from build_info() / a shared file.
 */
export const site = {
  name: 'Sizlon',
  tagline: 'Self-healing data systems',
  portalLoginUrl: 'https://portal.sizlon.io',
  contactEmail: 'hello@sizlon.io',
};

// Nav/legal hrefs and keys are language-neutral; labels come from content[lang].
export const nav = [
  { href: '/solutions', key: 'Solutions' },
  { href: '/how-it-works', key: 'How it works' },
  { href: '/security', key: 'Security' },
  { href: '/editions', key: 'Editions' },
  { href: '/contact', key: 'Contact' },
] as const;

export type Solution = {
  slug: 'crawler-platform' | 'verify';
  name: string; // product name — same in every locale
  stageKey: 'acquire' | 'trust';
  status: 'live' | 'next' | 'roadmap';
  href?: string;
};

export const solutions: Solution[] = [
  { slug: 'crawler-platform', name: 'Crawler Platform', stageKey: 'acquire', status: 'live', href: '/product' },
  { slug: 'verify', name: 'Verify', stageKey: 'trust', status: 'next' },
];

export const legalLinks = [
  { href: '/legal/terms', key: 'Terms' },
  { href: '/legal/privacy', key: 'Privacy' },
  { href: '/legal/licenses', key: 'Licenses' },
] as const;
