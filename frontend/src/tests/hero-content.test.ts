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
    expect(homepageContent.figmaReference.desktopNode).toBe("4:2");
    expect(homepageContent.figmaReference.mobileNode).toBe("4:183");
    expect(homepageContent.figmaReference.downloadStatesNode).toBe("4:326");
    expect(homepageContent.figmaReference.carouselStatesNode).toBe("4:357");
  });
});
