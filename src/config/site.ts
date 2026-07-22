/*
 * Thin shared-meta contract for the marketing site (see DESIGN_DIRECTION.md).
 * The only coupling point to the rest of the monorepo. In a later step these
 * values (portal URL, version) can be generated from build_info() / a shared file.
 */
export const site = {
  name: 'Sizlon',
  tagline: 'AI proposes. A deterministic layer verifies.',
  portalLoginUrl: 'https://portal.sizlon.io',
  contactEmail: 'hello@sizlon.io',
  // Contact form endpoint — a Google Apps Script web-app /exec URL. Paste the
  // deployed URL here to activate the form; while empty, the form no-ops on
  // submit and the mailto fallback carries. Not a secret (it's client-visible).
  contactFormEndpoint: 'https://svc.sizlon.io/api/contact',
  // Free notice-alert subscription (site-backend, double opt-in). Empty = form no-ops.
  subscribeEndpoint: 'https://svc.sizlon.io/api/subscribe',
  // Eligibility profile (A2) — token-authed GET (prefill) + POST (save). Empty = no-op.
  subscribeProfileEndpoint: 'https://svc.sizlon.io/api/subscribe/profile',
  // Paid screening application — one form (alert settings + company credentials);
  // creates the pending subscription + profile + account, then the confirmation
  // email's link goes straight to checkout (confirm?next=billing → 302).
  subscribeScreeningEndpoint: 'https://svc.sizlon.io/api/subscribe/screening',
  // Paid tier — Toss Payments monthly subscription (billing key). The checkout
  // endpoint returns the public Toss clientKey + a per-subscriber customerKey;
  // confirm exchanges the redirect authKey for a billingKey and charges month 1.
  billingCheckoutEndpoint: 'https://svc.sizlon.io/api/billing/checkout',
  billingConfirmEndpoint: 'https://svc.sizlon.io/api/billing/confirm',
  billingStatusEndpoint: 'https://svc.sizlon.io/api/billing/status',
  billingCancelEndpoint: 'https://svc.sizlon.io/api/billing/cancel',
  // Miriboa verification-request endpoint (site-backend, same host). The
  // connector and the site post the SAME form here; only `src` differs so we can
  // compare which surface converts (CONTEXT §94). While empty, the form no-ops.
  verifyRequestEndpoint: 'https://svc.sizlon.io/api/verification-request',
  // Multi-step wizard: step 2 creates a draft here; documents upload and the final
  // finalize go through manageBase/<token>/documents and /finalize.
  verifyDraftEndpoint: 'https://svc.sizlon.io/api/verification-draft',
  authRequestEndpoint: 'https://svc.sizlon.io/auth/request',
  authVerifyEndpoint: 'https://svc.sizlon.io/auth/verify',
  authLoginEndpoint: 'https://svc.sizlon.io/auth/login',
  authLogoutEndpoint: 'https://svc.sizlon.io/auth/logout',
  authSetPasswordEndpoint: 'https://svc.sizlon.io/auth/set-password',
  accountRequestsEndpoint: 'https://svc.sizlon.io/account/requests',
  accountProductsEndpoint: 'https://svc.sizlon.io/account/products',
  accountProfileEndpoint: 'https://svc.sizlon.io/account/profile',
  // Notice lookup (parse.sizlon.io, has the g2b key server-side). The verify form
  // calls GET ?no=<공고번호> to auto-fill 공고명·마감일·기관명·판돈. CORS-allowed for sizlon.io.
  noticeLookupEndpoint: 'https://parse.sizlon.io/api/notice',
  // Precheck (miriboa-precheck, check.sizlon.io): parses each dropped file transiently
  // (deleted immediately, no AI reads it) to flag scans/corrupt files before submission.
  precheckEndpoint: 'https://check.sizlon.io/api/precheck',
  // Manage-request base (site-backend). The /manage page reads ?t=<token> and calls
  // GET <base>/<token>, POST <base>/<token>/documents, POST <base>/<token>/delete.
  manageBase: 'https://svc.sizlon.io/r',
  // Cloudflare Turnstile site key (public). Set this AND the TURNSTILE_SECRET
  // script property in Apps Script to activate bot verification. While empty,
  // the widget is not rendered and the server skips the Turnstile check.
  turnstileSiteKey: '0x4AAAAAADzkjelT6SU8nIio',
};

// Global nav — buyer-first. Each product has its own problem-first landing and a
// direct nav entry (each buyer reaches their product in one hop — CONTEXT §94 IA
// audit, P4). There is no umbrella /products page: the homepage already carries the
// both-products overview, so a separate list page was redundant. Crawler's sub-pages
// (How it works / Security / Editions) stay scoped under that product (see
// crawlerPages), not in the company-level nav. Labels come from content[lang].
export const nav = [
  { href: '/products/miriboa', key: 'Miriboa' },
  { href: '/products/crawler-platform', key: 'Crawler Platform' },
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

// Miriboa's own sub-pages — same scoping rule as crawlerPages: the routes stay
// top-level, only their placement in navigation is scoped to the product.
//
// /precheck is deliberately NOT here. It answers "can our pipeline read this
// file?", which only matters to someone already headed for the paid
// verification — it is a step inside that path, not a free offer standing on
// its own, so it is surfaced from the Miriboa page's delivery note instead.
// (Demonstrating the parsing capability, its other original job, is now done
// far better by the connector reading a real notice in chat.)
export const miriboaPages = [
  { href: '/monitor', key: 'Free alerts' },
  { href: '/connector', key: 'Connector' },
] as const;

// The MCP connector endpoint users paste into Claude. Public, no auth.
export const connectorUrl = 'https://parse.sizlon.io/mcp/';

// The product line. `categoryKey` labels the domain (product-neutral — the
// company umbrella is the shared "propose then verify" DNA, not one lifecycle).
// `deliveryKeys` states how the product ships (secondary metadata, not a
// top-level taxonomy): self-hosted license, managed subscription, or a
// vendor-operated service. Labels come from content[lang].common.deliveries.
export type Solution = {
  slug: 'crawler-platform' | 'miriboa';
  name: string; // product name — same in every locale
  categoryKey: 'extraction' | 'verification';
  deliveryKeys: Array<'selfHosted' | 'managed' | 'service'>;
  status: 'live' | 'pilot' | 'next' | 'roadmap';
  href?: string;
};

export const solutions: Solution[] = [
  { slug: 'crawler-platform', name: 'Crawler Platform', categoryKey: 'extraction', deliveryKeys: ['selfHosted', 'managed'], status: 'live', href: '/products/crawler-platform' },
  { slug: 'miriboa', name: 'Miriboa', categoryKey: 'verification', deliveryKeys: ['service'], status: 'live', href: '/products/miriboa' },
];

export const legalLinks = [
  { href: '/legal/terms', key: 'Terms' },
  { href: '/legal/privacy', key: 'Privacy' },
  { href: '/legal/licenses', key: 'Licenses' },
] as const;
