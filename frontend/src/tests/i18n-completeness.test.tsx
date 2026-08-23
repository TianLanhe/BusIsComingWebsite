import { describe, expect, it } from "vitest";
import { homepageContent } from "../content/homepageContent";
import { locales } from "../content/locales";
import { privacyPolicyContent } from "../content/privacyPolicyContent";
import { uiCopy } from "../content/uiCopy";

function assertLocalizedStrings(value: unknown, path = "root") {
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  const localeKeyCount = locales.filter((locale) => keys.includes(locale)).length;
  if (localeKeyCount > 0) {
    expect(localeKeyCount, path + " missing locale key").toBe(locales.length);
    for (const locale of locales) {
      if (Array.isArray(record[locale])) {
        expect(record[locale], path + "." + locale).toEqual(expect.arrayContaining([expect.any(String)]));
      } else {
        expect(record[locale], path + "." + locale).toEqual(expect.any(String));
        expect((record[locale] as string).trim().length, path + "." + locale).toBeGreaterThan(0);
      }
    }
  }
  for (const [key, child] of Object.entries(record)) assertLocalizedStrings(child, path + "." + key);
}

describe("i18n completeness", () => {
  it("keeps all localized content complete across the three locales", () => {
    assertLocalizedStrings(homepageContent, "homepageContent");
    assertLocalizedStrings(privacyPolicyContent, "privacyPolicyContent");
    assertLocalizedStrings(uiCopy, "uiCopy");
  });

  it("keeps the five approved story messages and explicit line groups localized", () => {
    for (const story of homepageContent.hero.stories) {
      for (const locale of locales) {
        expect(story.title[locale]).toBeTruthy();
        expect(story.description[locale]).toBeTruthy();
        expect(story.lineBreakHints[locale]).toHaveLength(2);
      }
    }
    expect(homepageContent.hero.stories[0].title["zh-Hant"]).toBe("隨心搜尋，出發更輕鬆");
    expect(homepageContent.hero.stories[4].title.en).toBe("Look up less. Leave with confidence.");
  });

  it("uses Hong Kong Traditional Chinese wording independently from Simplified Chinese", () => {
    expect(homepageContent.routeTrial.title["zh-Hant"]).not.toBe(homepageContent.routeTrial.title["zh-Hans"]);
    expect(homepageContent.downloadDecision.description["zh-Hant"]).not.toBe(homepageContent.downloadDecision.description["zh-Hans"]);
    expect(homepageContent.supportEnding.privacyLink.label["zh-Hant"]).toBe("私隱政策");
    expect(homepageContent.hero.stories[3].description["zh-Hant"]).toContain("龍運");
    expect(JSON.stringify(homepageContent)).not.toContain("支持我们");
  });
});
