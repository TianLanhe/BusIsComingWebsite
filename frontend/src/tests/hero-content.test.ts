import { describe, expect, it } from "vitest";
import { homepageContent } from "../content/homepageContent";
import { locales } from "../content/locales";

describe("hero content", () => {
  it("contains the approved positioning, two actions, and five stories in all locales", () => {
    for (const locale of locales) {
      expect(homepageContent.hero.eyebrow[locale]).toBeTruthy();
      expect(homepageContent.hero.productPositioning[locale]).toBeTruthy();
      expect(homepageContent.hero.primaryAction.label[locale]).toBeTruthy();
      expect(homepageContent.hero.secondaryAction.label[locale]).toBeTruthy();
      for (const story of homepageContent.hero.stories) {
        expect(story.title[locale]).toBeTruthy();
        expect(story.description[locale]).toBeTruthy();
        expect(story.lineBreakHints[locale]).toHaveLength(2);
      }
    }
  });

  it("pins implementation to the final Figma contract", () => {
    expect(homepageContent.figmaReference.fileUrl).toContain("figma.com");
    expect(homepageContent.figmaReference.sectionNode).toBe("119:64");
    expect(homepageContent.figmaReference.desktopHeroNode).toBe("119:176");
    expect(homepageContent.figmaReference.mobileHeroNode).toBe("119:461");
    expect(homepageContent.figmaReference.designVersion).toContain("FINAL");
  });

  it("preserves the approved Traditional Chinese story copy exactly", () => {
    expect(homepageContent.hero.stories.map((story) => story.title["zh-Hant"])).toEqual([
      "隨心搜尋，出發更輕鬆",
      "常走的路，一按更省心",
      "一路看清，出行更安心",
      "班次看得全，候車更從容",
      "不用盯手機，出門更有把握",
    ]);
    expect(homepageContent.hero.stories[1].description["zh-Hant"]).toBe("路線、車費與候車時間集中比較，選擇更清楚");
  });

  it("avoids old multi-leg and single-operator product positioning", () => {
    const hero = JSON.stringify(homepageContent.hero);
    expect(hero).not.toContain("多程总车费");
    expect(hero).not.toContain("multi-leg");
    expect(homepageContent.hero.productPositioning.en).not.toContain("Citybus");
  });
});
