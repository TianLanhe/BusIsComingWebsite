import { describe, expect, it } from "vitest";
import { downloadManifest } from "../content/downloadManifest";
import { homepageContent } from "../content/homepageContent";
import { locales } from "../content/locales";
import { onlineQueryDemo } from "../content/onlineQueryDemo";
import { privacyPolicyContent } from "../content/privacyPolicyContent";
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
    assertLocalizedStrings(privacyPolicyContent, "privacyPolicyContent");
    assertLocalizedStrings(uiCopy, "uiCopy");
  });

  it("keeps key zh-Hant copy written for Hong Kong instead of mirroring zh-Hans", () => {
    const samples = [
      homepageContent.hero.headline,
      homepageContent.hero.subheading,
      homepageContent.featureShowcase[0].description,
      homepageContent.downloadSection.description,
      onlineQueryDemo.scopeNotice,
      privacyPolicyContent.hero.title,
      privacyPolicyContent.sections[2].title,
    ];

    for (const sample of samples) {
      expect(sample["zh-Hant"]).not.toBe(sample["zh-Hans"]);
      expect(sample["zh-Hant"]).not.toContain("支持");
    }

    expect(homepageContent.hero.headline["zh-Hant"]).toContain("城巴");
    expect(homepageContent.featureShowcase[0].description["zh-Hant"]).toContain("城巴");
    expect(homepageContent.featureShowcase[2].title["zh-Hant"]).toContain("抵站時間");
    expect(homepageContent.onlineQueryDemo.scopeNotice["zh-Hant"]).toContain("港鐵");
    expect(privacyPolicyContent.hero.title["zh-Hant"]).toContain("私隱政策");
    expect(privacyPolicyContent.sections[2].title["zh-Hant"]).toContain("資料");
  });

  it("keeps homepage UI polish copy complete and naturally localized", () => {
    const polish = homepageContent.homepageUiPolish;

    expect(polish.fareCopy.title["zh-Hant"]).toBe("車費一眼看清");
    expect(polish.fareCopy.title["zh-Hans"]).toBe("车费一眼看清");
    expect(polish.fareCopy.title.en).toBe("Fare at a glance");
    expect(polish.fareCopy.description["zh-Hant"]).toBe("每條候選路線直接顯示車費，毋須點入詳情才知道大約花費。");
    expect(polish.fareCopy.description["zh-Hans"]).toBe("每条候选路线直接显示车费，不用点进详情才知道大致花费。");
    expect(polish.fareCopy.description.en).toBe("See the fare on each route option without opening details first.");
    expect(polish.fareCopy.description.en).not.toContain("currency label");
    expect(uiCopy.durationLabel["zh-Hant"]).toBe("耗時");
    expect(uiCopy.durationLabel["zh-Hans"]).toBe("耗时");
    expect(uiCopy.durationLabel.en).toBe("Time");
    expect(uiCopy.walkingLabel.en).toBe("Walk");
    expect(uiCopy.closeLightbox["zh-Hant"]).not.toBe(uiCopy.closeLightbox["zh-Hans"]);
    expect(uiCopy.stopInfoUnavailable.en).toBe("Stop details unavailable");
  });
});
