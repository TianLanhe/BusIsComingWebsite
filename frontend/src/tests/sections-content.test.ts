import { describe, expect, it } from "vitest";
import { homepageContent } from "../content/homepageContent";
import { locales } from "../content/locales";

describe("downstream sections content", () => {
  it("covers six core capabilities", () => {
    expect(homepageContent.features).toHaveLength(6);
    expect(homepageContent.homepageUiPolish.featureGrid.mobileColumns).toBe(2);
    expect(homepageContent.homepageUiPolish.featureGrid.futureFeatureCount).toBeGreaterThanOrEqual(10);
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
    expect(homepageContent.navigation.items.find((item) => item.id === "contact")?.label["zh-Hant"]).toBe("聯絡我們");
    expect(homepageContent.navigation.items.find((item) => item.id === "contact")?.label["zh-Hans"]).toBe("联系我们");
    expect(homepageContent.navigation.items.find((item) => item.id === "contact")?.label.en).toBe("Contact Us");
    expect(homepageContent.contact[0].href).toBe("mailto:hezhenyu966@gmail.com");
    expect(homepageContent.footerPrivacyLink.label["zh-Hant"]).toBe("私隱政策");
    expect(homepageContent.footerPrivacyLink.label["zh-Hans"]).toBe("隐私政策");
    expect(homepageContent.footerPrivacyLink.label.en).toBe("Privacy Policy");
    expect(homepageContent.footerPrivacyLink.href).toEqual({
      "zh-Hant": "/zh-hant/privacy/",
      "zh-Hans": "/zh-hans/privacy/",
      en: "/en/privacy/",
    });
    expect(homepageContent.navigation.items.some((item) => /privacy|私隱|隐私/i.test(JSON.stringify(item)))).toBe(false);
  });

  it("keeps Android download available without adding out-of-scope transport claims", () => {
    const androidFaq = homepageContent.faq.find((item) => item.id === "android-install");

    expect(androidFaq?.answer.en).toContain("current Android APK is available");
    expect(homepageContent.scopeExclusions.map((entry) => entry.en).join(" ")).toContain("Full trip planning is out of scope");
  });

  it("keeps scope centered on Citybus and excludes wider Hong Kong transport claims", () => {
    const allCopy = [
      homepageContent.hero.headline.en,
      homepageContent.hero.subheading.en,
      homepageContent.features.map((feature) => feature.description.en).join(" "),
      homepageContent.onlineQueryDemo.scopeNotice.en,
      homepageContent.faq.map((item) => item.answer.en).join(" "),
    ].join(" ");

    expect(allCopy).toContain("Citybus");
    expect(allCopy).toContain("KMB");
    expect(allCopy).toContain("MTR");
    expect(allCopy).toContain("ferry");
    expect(homepageContent.hero.subheading.en).not.toContain("Hong Kong bus commuters");
  });

  it("keeps zh-Hant copy in Hong Kong transport wording", () => {
    const zhHantCopy = [
      homepageContent.hero.subheading["zh-Hant"],
      homepageContent.featureShowcase.map((slide) => `${slide.title["zh-Hant"]} ${slide.description["zh-Hant"]}`).join(" "),
      homepageContent.features.map((feature) => `${feature.title["zh-Hant"]} ${feature.description["zh-Hant"]}`).join(" "),
      homepageContent.onlineQueryDemo.scopeNotice["zh-Hant"],
      homepageContent.faq.map((item) => item.answer["zh-Hant"]).join(" "),
    ].join(" ");

    expect(zhHantCopy).toContain("抵站時間");
    expect(zhHantCopy).toContain("交通費用");
    expect(zhHantCopy).toContain("港鐵");
    expect(zhHantCopy).toContain("渡輪");
    expect(zhHantCopy).not.toContain("支持我们");
  });

  it("removes old support wording and placeholder email from user-facing content", () => {
    const allContent = JSON.stringify(homepageContent);

    expect(allContent).not.toContain("feedback@busiscoming.local");
    expect(allContent).not.toContain("支援我們");
    expect(allContent).not.toContain("支持我们");
    expect(allContent).not.toContain('"Support"');
    expect(allContent).toContain("hezhenyu966@gmail.com");
  });

  it("uses natural fare-at-a-glance copy instead of internal implementation notes", () => {
    const fareFeature = homepageContent.features.find((feature) => feature.id === "hkd-display");
    const { forbiddenPhrases, ...fareCopy } = homepageContent.homepageUiPolish.fareCopy;
    const userFacingContent = JSON.stringify({ ...homepageContent, homepageUiPolish: { ...homepageContent.homepageUiPolish, fareCopy } });

    expect(fareFeature?.title["zh-Hant"]).toBe("車費一眼看清");
    expect(fareFeature?.title["zh-Hans"]).toBe("车费一眼看清");
    expect(fareFeature?.title.en).toBe("Fare at a glance");
    expect(fareFeature?.description["zh-Hant"]).toBe("每條候選路線直接顯示車費，毋須點入詳情才知道大約花費。");
    expect(fareFeature?.description["zh-Hans"]).toBe("每条候选路线直接显示车费，不用点进详情才知道大致花费。");
    expect(fareFeature?.description.en).toBe("See the fare on each route option without opening details first.");
    expect(userFacingContent).not.toContain("多程总车费");
    expect(userFacingContent).not.toContain("比较城巴方案时，可直接看到多程全程总车费，而不只是币种显示。");
    expect(userFacingContent).not.toContain("not just the currency label");
    expect(forbiddenPhrases).toContain("比较城巴方案时，可直接看到多程全程总车费，而不只是币种显示。");
  });
});
