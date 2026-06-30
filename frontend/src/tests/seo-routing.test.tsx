import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { I18nProvider, useI18n } from "../components/i18n/I18nProvider";
import { LanguageSwitcher } from "../components/i18n/LanguageSwitcher";
import { SeoHead } from "../components/seo/SeoHead";
import {
  alternateLinksForPage,
  canonicalUrlForLocale,
  canonicalUrlForPage,
  localizedPathForLocale,
  seoLocales,
  seoPageGroups,
  seoPages,
} from "../content/seo";
import sitemap from "../../public/sitemap.xml?raw";

function LocaleProbe() {
  const { locale } = useI18n();
  return <output aria-label="locale">{locale}</output>;
}

function renderSeoHarness() {
  return render(
    <I18nProvider>
      <SeoHead />
      <LanguageSwitcher label="Language" />
      <LocaleProbe />
    </I18nProvider>,
  );
}

describe("localized SEO routing", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("uses the locale path as the initial language and writes locale-specific head tags", async () => {
    window.history.replaceState({}, "", "/zh-hans/");

    renderSeoHarness();

    await waitFor(() => expect(document.documentElement.lang).toBe("zh-Hans"));
    expect(screen.getByLabelText("locale")).toHaveTextContent("zh-Hans");
    expect(document.title).toBe(seoPages["zh-Hans"].title);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", seoPages["zh-Hans"].description);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", canonicalUrlForLocale("zh-Hans"));

    const alternates = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')).map((link) => [
      link.hreflang,
      link.href,
    ]);
    expect(alternates).toEqual([
      ["zh-Hant", canonicalUrlForLocale("zh-Hant")],
      ["zh-Hans", canonicalUrlForLocale("zh-Hans")],
      ["en", canonicalUrlForLocale("en")],
      ["x-default", canonicalUrlForLocale("zh-Hant")],
    ]);
  });

  it("changes the URL and SEO head when users switch language", async () => {
    window.history.replaceState({}, "", "/zh-hant/#features");

    renderSeoHarness();

    expect(screen.getByTitle("English")).toHaveAttribute("href", "/en/#features");
    fireEvent.click(screen.getByTitle("English"));

    await waitFor(() => expect(window.location.pathname).toBe("/en/"));
    expect(window.location.hash).toBe("#features");
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe(seoPages.en.title);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", canonicalUrlForLocale("en"));
  });

  it("keeps localized path helpers aligned with canonical SEO pages", () => {
    expect(seoLocales).toEqual(["zh-Hant", "zh-Hans", "en"]);
    expect(localizedPathForLocale("zh-Hant", { pathname: "/en/", search: "", hash: "" })).toBe("/zh-hant/");
    expect(localizedPathForLocale("zh-Hans", { pathname: "/zh-hant/", search: "?source=test", hash: "#faq" })).toBe(
      "/zh-hans/?source=test#faq",
    );
    expect(localizedPathForLocale("en", { pathname: "/zh-hant/privacy/", search: "", hash: "" })).toBe("/en/privacy/");
  });

  it("keeps privacy SEO separate from homepage SEO", async () => {
    window.history.replaceState({}, "", "/zh-hant/privacy/");

    render(
      <I18nProvider>
        <SeoHead />
        <LocaleProbe />
      </I18nProvider>,
    );

    await waitFor(() => expect(document.documentElement.lang).toBe("zh-Hant"));
    expect(screen.getByLabelText("locale")).toHaveTextContent("zh-Hant");
    expect(document.title).toBe(seoPageGroups.privacy.locales["zh-Hant"].title);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      seoPageGroups.privacy.locales["zh-Hant"].description,
    );
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", canonicalUrlForPage("zh-Hant", "privacy"));

    const alternates = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')).map((link) => [
      link.hreflang,
      link.href,
    ]);
    expect(alternates).toEqual(alternateLinksForPage("privacy").map((link) => [link.hreflang, link.href]));
    expect(alternates.map(([, href]) => href).every((href) => href.includes("/privacy/"))).toBe(true);
  });

  it("publishes all locale URLs with reciprocal hreflang in sitemap", () => {
    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(sitemap).not.toContain("<loc>https://www.busiscoming.com/</loc>");
    for (const locale of seoLocales) {
      expect(sitemap).toContain(`<loc>${canonicalUrlForLocale(locale)}</loc>`);
      expect(sitemap).toContain(`hreflang="${locale}" href="${canonicalUrlForLocale(locale)}"`);
      expect(sitemap).toContain(`<loc>${canonicalUrlForPage(locale, "privacy")}</loc>`);
      expect(sitemap).toContain(`hreflang="${locale}" href="${canonicalUrlForPage(locale, "privacy")}"`);
    }
    expect(sitemap).toContain('hreflang="x-default" href="https://www.busiscoming.com/zh-hant/"');
    expect(sitemap).toContain('hreflang="x-default" href="https://www.busiscoming.com/zh-hant/privacy/"');
    expect(sitemap.match(/hreflang="x-default"/g)).toHaveLength(6);
  });
});
