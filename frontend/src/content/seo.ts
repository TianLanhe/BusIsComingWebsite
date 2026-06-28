import seoPagesConfig from "./seoPages.json";
import type { Locale } from "./types";

export interface SeoPageMetadata {
  path: string;
  htmlLang: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
}

interface SeoPagesConfig {
  siteUrl: string;
  defaultLocale: Locale;
  locales: Record<Locale, SeoPageMetadata>;
}

const config = seoPagesConfig as SeoPagesConfig;

export const siteUrl = config.siteUrl;
export const defaultSeoLocale = config.defaultLocale;
export const seoPages = config.locales;
export const seoLocales = Object.keys(seoPages) as Locale[];

export function absoluteSiteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}

export function canonicalUrlForLocale(locale: Locale): string {
  return absoluteSiteUrl(seoPages[locale].path);
}

export function alternateLinksForLocale() {
  return [
    ...seoLocales.map((locale) => ({
      hreflang: locale,
      href: canonicalUrlForLocale(locale),
    })),
    {
      hreflang: "x-default",
      href: canonicalUrlForLocale(defaultSeoLocale),
    },
  ];
}

export function localeFromPathname(pathname: string): Locale | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (!firstSegment) {
    return null;
  }
  const normalizedLocalePath = `/${firstSegment}/`;
  const match = seoLocales.find((locale) => seoPages[locale].path === normalizedLocalePath);
  return match ?? null;
}

export function localizedPathForLocale(
  locale: Locale,
  locationLike: Pick<Location, "pathname" | "search" | "hash"> = window.location,
): string {
  const search = locationLike.search ?? "";
  const hash = locationLike.hash ?? "";
  return `${seoPages[locale].path}${search}${hash}`;
}
