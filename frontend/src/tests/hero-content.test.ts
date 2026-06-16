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
    expect(homepageContent.figmaReference.pageNode).toBe("10:2");
    expect(homepageContent.figmaReference.desktopNode).toBe("10:3");
    expect(homepageContent.figmaReference.mobileNode).toBe("10:44");
    expect(homepageContent.figmaReference.downloadStatesNode).toBe("10:75");
    expect(homepageContent.figmaReference.carouselStatesNode).toBe("10:87");
    expect(homepageContent.figmaReference.notesNode).toBe("10:176");
  });
});
