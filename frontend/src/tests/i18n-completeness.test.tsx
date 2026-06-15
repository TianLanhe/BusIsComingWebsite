import { describe, expect, it } from "vitest";
import { downloadManifest } from "../content/downloadManifest";
import { homepageContent } from "../content/homepageContent";
import { locales } from "../content/locales";
import { onlineQueryDemo } from "../content/onlineQueryDemo";
import { uiCopy } from "../content/uiCopy";

function assertLocalizedStrings(value: unknown, path = "root") {
  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  const localeKeyCount = locales.filter((locale) => keys.includes(locale)).length;
  if (localeKeyCount > 0) {
    expect(localeKeyCount, `${path} missing locale key`).toBe(locales.length);
    for (const locale of locales) {
      expect(record[locale], `${path}.${locale}`).toEqual(expect.any(String));
      expect((record[locale] as string).trim().length, `${path}.${locale}`).toBeGreaterThan(0);
    }
  }

  for (const [key, child] of Object.entries(record)) {
    assertLocalizedStrings(child, `${path}.${key}`);
  }
}

describe("i18n completeness", () => {
  it("keeps all localized content complete across zh-Hant, zh-Hans, and en", () => {
    assertLocalizedStrings(homepageContent, "homepageContent");
    assertLocalizedStrings(downloadManifest, "downloadManifest");
    assertLocalizedStrings(onlineQueryDemo, "onlineQueryDemo");
    assertLocalizedStrings(uiCopy, "uiCopy");
  });
});
