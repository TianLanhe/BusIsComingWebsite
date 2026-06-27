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
    expect(homepageContent.homepageUiPolish.figmaReference.fileUrl).toContain("figma.com");
    expect(homepageContent.homepageUiPolish.figmaReference.pageName).toBe("Homepage UI Polish - 007");
    expect(homepageContent.homepageUiPolish.figmaReference.nodeNames).toContain("Desktop 1440 / Screenshot Lightbox");
  });

  it("uses fare-at-a-glance hero and carousel copy without old multi-leg wording", () => {
    const heroAndCarouselCopy = JSON.stringify({
      hero: homepageContent.hero,
      featureShowcase: homepageContent.featureShowcase,
    });
    const fareSlide = homepageContent.featureShowcase.find((slide) => slide.id === "route-comparison");

    expect(homepageContent.hero.bullets[1].title["zh-Hans"]).toBe("车费一眼看清");
    expect(fareSlide?.title["zh-Hant"]).toBe("車費一眼看清");
    expect(fareSlide?.title["zh-Hans"]).toBe("车费一眼看清");
    expect(fareSlide?.title.en).toBe("Fare at a glance");
    expect(heroAndCarouselCopy).not.toContain("多程总车费");
    expect(heroAndCarouselCopy).not.toContain("multi-leg");
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
