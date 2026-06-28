import { useEffect } from "react";
import { alternateLinksForLocale, canonicalUrlForLocale, seoPages } from "../../content/seo";
import type { Locale } from "../../content/types";
import { useI18n } from "../i18n/I18nProvider";

function upsertMeta(selector: string, createAttributes: Record<string, string>, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    for (const [name, value] of Object.entries(createAttributes)) {
      element.setAttribute(name, value);
    }
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

function syncCanonical(locale: Locale) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = canonicalUrlForLocale(locale);
}

function syncAlternateLinks() {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((element) => element.remove());

  for (const alternate of alternateLinksForLocale()) {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = alternate.hreflang;
    link.href = alternate.href;
    link.dataset.busiscomingHreflang = "true";
    document.head.append(link);
  }
}

export function SeoHead() {
  const { locale } = useI18n();

  useEffect(() => {
    const page = seoPages[locale];
    const canonical = canonicalUrlForLocale(locale);

    document.title = page.title;
    upsertMeta('meta[name="description"]', { name: "description" }, page.description);
    upsertMeta('meta[name="robots"]', { name: "robots" }, "index, follow");
    syncCanonical(locale);
    syncAlternateLinks();
    upsertMeta('meta[property="og:type"]', { property: "og:type" }, "website");
    upsertMeta('meta[property="og:url"]', { property: "og:url" }, canonical);
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, page.ogTitle);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, page.ogDescription);
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary");
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, page.twitterTitle);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, page.twitterDescription);
  }, [locale]);

  return null;
}
