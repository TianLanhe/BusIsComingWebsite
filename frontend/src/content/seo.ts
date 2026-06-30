import seoPagesConfig from "./seoPages.json";
import { pageIdFromPathname, parseLocaleFromPathname } from "./pageRouting";
import type { Locale, SeoPageGroup, SeoPageId } from "./types";

export interface SeoPageMetadata {
  path: string;
  htmlLang: string;
  canonical: string;
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
  pages: Record<SeoPageId, SeoPageGroup>;
}

const config = seoPagesConfig as SeoPagesConfig;

export const siteUrl = config.siteUrl;
export const defaultSeoLocale = config.defaultLocale;
export const seoPageGroups = config.pages;
export const seoPages = seoPageGroups.home.locales;
export const seoLocales = Object.keys(seoPages) as Locale[];
export const seoPageIds = Object.keys(seoPageGroups) as SeoPageId[];

export function absoluteSiteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}

export function seoPageMetadataFor(locale: Locale, pageId: SeoPageId = "home"): SeoPageMetadata {
  return seoPageGroups[pageId].locales[locale];
}

export function canonicalUrlForPage(locale: Locale, pageId: SeoPageId = "home"): string {
  const page = seoPageMetadataFor(locale, pageId);
  return page.canonical || absoluteSiteUrl(page.path);
}

export function canonicalUrlForLocale(locale: Locale): string {
  return canonicalUrlForPage(locale, "home");
}

export function alternateLinksForPage(pageId: SeoPageId = "home") {
  const pageGroup = seoPageGroups[pageId];
  return [
    ...seoLocales.map((locale) => ({
      hreflang: locale,
      href: canonicalUrlForPage(locale, pageId),
    })),
    {
      hreflang: "x-default",
      href: pageGroup.xDefault || canonicalUrlForPage(pageGroup.defaultLocale, pageId),
    },
  ];
}

export function alternateLinksForLocale() {
  return alternateLinksForPage("home");
}

export function localeFromPathname(pathname: string): Locale | null {
  return parseLocaleFromPathname(pathname);
}

export function seoPageIdFromPathname(pathname: string): SeoPageId {
  const pageId = pageIdFromPathname(pathname);
  return seoPageGroups[pageId] ? pageId : "home";
}

export function localizedPathForLocale(
  locale: Locale,
  locationLike: Pick<Location, "pathname" | "search" | "hash"> = window.location,
): string {
  const search = locationLike.search ?? "";
  const hash = locationLike.hash ?? "";
  const pageId = seoPageIdFromPathname(locationLike.pathname);

  // 语言切换需要保留当前页面组；否则未来若在隐私页恢复切换器，会错误跳回首页。
  return `${seoPageMetadataFor(locale, pageId).path}${search}${hash}`;
}
