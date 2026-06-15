import { describe, expect, it } from "vitest";
import { homepageContent } from "../content/homepageContent";
import { locales } from "../content/locales";

describe("downstream sections content", () => {
  it("covers six core capabilities", () => {
    expect(homepageContent.features).toHaveLength(6);
    expect(homepageContent.features.map((feature) => feature.id)).toEqual([
      "saved-routes",
      "route-comparison",
      "multiple-eta",
      "route-details",
      "short-monitor",
      "hkd-display",
    ]);
  });

  it("covers required FAQ categories and contact entry in all locales", () => {
    expect(homepageContent.faq.map((item) => item.category)).toEqual([
      "android-install",
      "ios-status",
      "online-query-limit",
      "data-scope",
    ]);
    for (const locale of locales) {
      expect(homepageContent.contact[0].label[locale]).toBeTruthy();
      expect(homepageContent.scopeExclusions.every((entry) => entry[locale].length > 0)).toBe(true);
    }
  });

  it("keeps Android download available without adding out-of-scope transport claims", () => {
    const androidFaq = homepageContent.faq.find((item) => item.id === "android-install");

    expect(androidFaq?.answer.en).toContain("current Android APK is available");
    expect(homepageContent.scopeExclusions.map((entry) => entry.en).join(" ")).toContain("Full trip planning is out of scope");
  });
});
