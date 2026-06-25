import { describe, expect, it } from "vitest";
import { homepageContent } from "../content/homepageContent";
import { locales } from "../content/locales";

describe("hero content", () => {
  it("contains the product positioning, primary download action, and secondary online query action in all locales", () => {
    for (const locale of locales) {
      expect(homepageContent.hero.headline[locale]).toBeTruthy();
      expect(homepageContent.hero.subheading[locale]).toContain(locale === "en" ? "Android" : "Android");
      expect(homepageContent.hero.primaryAction.label[locale]).toBeTruthy();
      expect(homepageContent.hero.secondaryAction.label[locale]).toBeTruthy();
    }
  });

  it("keeps the Figma references needed by implementation", () => {
    expect(homepageContent.figmaReference.fileUrl).toContain("figma.com");
    expect(homepageContent.figmaReference.pageNode).toBe("Homepage Experience Polish - 005");
    expect(homepageContent.figmaReference.desktopNode).toBe("29:3");
    expect(homepageContent.figmaReference.mobileNode).toBe("29:44");
    expect(homepageContent.figmaReference.downloadStatesNode).toBe("29:101");
    expect(homepageContent.figmaReference.carouselStatesNode).toBe("29:83");
    expect(homepageContent.figmaReference.notesNode).toBe("29:108");
  });

  it("keeps hero and carousel zh-Hant copy separate from zh-Hans direct conversion", () => {
    expect(homepageContent.hero.subheading["zh-Hant"]).toContain("抵站時間");
    expect(homepageContent.hero.subheading["zh-Hant"]).not.toBe(homepageContent.hero.subheading["zh-Hans"]);

    for (const slide of homepageContent.featureShowcase) {
      expect(slide.title["zh-Hant"], slide.id).not.toBe(slide.title["zh-Hans"]);
      expect(slide.description["zh-Hant"], slide.id).toContain("城巴");
    }
  });
});
