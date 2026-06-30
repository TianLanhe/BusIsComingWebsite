import { locales } from "./locales";
import type { Locale, SeoPageId } from "./types";

const localePathSegments: Record<Locale, string> = {
  "zh-Hant": "zh-hant",
  "zh-Hans": "zh-hans",
  en: "en",
};

const localeByPathSegment = Object.fromEntries(
  locales.map((locale) => [localePathSegments[locale], locale]),
) as Record<string, Locale>;

export interface PageRoute {
  locale: Locale | null;
  pageId: SeoPageId;
  isPrivacyPage: boolean;
}

export function pathForLocaleAndPage(locale: Locale, pageId: SeoPageId): string {
  const prefix = `/${localePathSegments[locale]}/`;
  return pageId === "privacy" ? `${prefix}privacy/` : prefix;
}

export function homePathForLocale(locale: Locale): string {
  return pathForLocaleAndPage(locale, "home");
}

export function privacyPathForLocale(locale: Locale): string {
  return pathForLocaleAndPage(locale, "privacy");
}

export function parseLocaleFromPathname(pathname: string): Locale | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return firstSegment ? localeByPathSegment[firstSegment] ?? null : null;
}

export function pageIdFromPathname(pathname: string): SeoPageId {
  const segments = pathname.split("/").filter(Boolean);
  return segments[1] === "privacy" ? "privacy" : "home";
}

export function routeFromPathname(pathname: string): PageRoute {
  const pageId = pageIdFromPathname(pathname);
  return {
    locale: parseLocaleFromPathname(pathname),
    pageId,
    isPrivacyPage: pageId === "privacy",
  };
}

export function currentPageRoute(): PageRoute {
  if (typeof window === "undefined") {
    return { locale: null, pageId: "home", isPrivacyPage: false };
  }
  return routeFromPathname(window.location.pathname);
}

export function homepageHrefForTarget(locale: Locale, target: string, pageId: SeoPageId): string {
  if (!target.startsWith("#")) {
    return target;
  }

  // 隐私页没有首页锚点内容，导航锚点必须先回到当前语言首页再定位到对应 section。
  return pageId === "privacy" ? `${homePathForLocale(locale)}${target}` : target;
}
