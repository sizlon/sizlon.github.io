import { content, type Lang } from './content';

export const defaultLang: Lang = 'en';
export const languages: Record<Lang, string> = { en: 'EN', ko: 'KO' };

/** Locale of a URL pathname ('/ko/...' → 'ko', otherwise the default). */
export function langFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  return first in languages ? (first as Lang) : defaultLang;
}

/** Strip the locale prefix to the logical (default-locale) path. */
export function logicalPath(url: URL): string {
  const stripped = url.pathname.replace(/^\/ko(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
}

/** Map a logical path to its localized URL ('/products' + ko → '/ko/products'). */
export function localizePath(path: string, lang: Lang): string {
  if (lang === defaultLang) return path;
  return path === '/' ? '/ko/' : `/ko${path}`;
}

/** Convenience accessor for a locale's content tree. */
export function t(lang: Lang) {
  return content[lang];
}
