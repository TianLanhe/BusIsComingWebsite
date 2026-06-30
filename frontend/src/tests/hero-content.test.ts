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
    expect(homepageContent.homepageUiPolish.figmaReference.nodeIdsResolved).toBe(true);
    expect(homepageContent.homepageUiPolish.figmaReference.nodeIds["Desktop 1440 / Screenshot Lightbox"]).toBe("51:113");
    expect(homepageContent.homepageUiPolish.figmaReference.nodeIds["Mobile 390 / Compact Route Result Card"]).toBe("51:151");
  });

  it("uses route-comparison hero and carousel copy without old multi-leg wording", () => {
    const heroAndCarouselCopy = JSON.stringify({
      hero: homepageContent.hero,
      featureShowcase: homepageContent.featureShowcase,
    });
    const routeComparisonSlide = homepageContent.featureShowcase.find((slide) => slide.id === "route-comparison");

    expect(homepageContent.hero.bullets[1].title["zh-Hant"]).toBe("路線比較更清楚");
    expect(homepageContent.hero.bullets[1].title["zh-Hans"]).toBe("路线比较更清楚");
    expect(routeComparisonSlide?.title["zh-Hant"]).toBe("路線比較更清楚");
    expect(routeComparisonSlide?.title["zh-Hans"]).toBe("路线比较更清楚");
    expect(routeComparisonSlide?.title.en).toBe("Clearer route comparison");
    expect(routeComparisonSlide?.description["zh-Hans"]).toBe("同页查看候选城巴路线的车费、行程时间和步行距离，选择路线前先比较清楚。");
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
