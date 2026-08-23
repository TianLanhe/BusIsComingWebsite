import { describe, expect, it } from "vitest";
import { homepageContent } from "../content/homepageContent";
import { locales } from "../content/locales";

describe("downstream sections content", () => {
  it("keeps the route trial, download decision, and support ending complete", () => {
    expect(homepageContent.routeTrial.title.en).toContain("bus journey");
    expect(homepageContent.downloadDecision.minimumAndroid.en).toBe("Android 7.1+");
    expect(homepageContent.supportEnding.faq).toHaveLength(4);
    expect(homepageContent.supportEnding.faq.map((item) => item.id)).toEqual([
      "android-install",
      "data-coverage",
      "website-app-difference",
      "iphone-support",
    ]);
    expect(homepageContent.supportEnding.faq.filter((item) => item.defaultOpen)).toHaveLength(1);
  });

  it("keeps navigation and support links complete in every locale", () => {
    expect(homepageContent.navigation.items.map((item) => item.id)).toEqual(["features", "faq", "contact"]);
    for (const locale of locales) {
      expect(homepageContent.navigation.items.every((item) => item.label[locale].length > 0)).toBe(true);
      expect(homepageContent.supportEnding.privacyLink.label[locale]).toBeTruthy();
      expect(homepageContent.scopeExclusions.every((entry) => entry[locale].length > 0)).toBe(true);
    }
    expect(homepageContent.supportEnding.contact.target).toBe("mailto:hezhenyu966@gmail.com");
  });

  it("positions the app as a bus product that can grow beyond one operator", () => {
    expect(homepageContent.hero.productPositioning.en).toBe("A Hong Kong bus route planner and navigation app");
    expect(homepageContent.supportEnding.faq.find((item) => item.id === "data-coverage")?.answer.en).toContain("coverage grows");
    expect(homepageContent.hero.productPositioning.en).not.toContain("Citybus-only");
  });
});
