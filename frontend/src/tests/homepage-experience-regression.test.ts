import { describe, expect, it } from "vitest";
import { homepageContent } from "../content/homepageContent";

describe("homepage visual-system regression guards", () => {
  it("keeps only the approved four-section narrative", () => {
    expect(homepageContent).toHaveProperty("hero");
    expect(homepageContent).toHaveProperty("routeTrial");
    expect(homepageContent).toHaveProperty("downloadDecision");
    expect(homepageContent).toHaveProperty("supportEnding");
    expect(homepageContent).not.toHaveProperty("featureShowcase");
    expect(homepageContent).not.toHaveProperty("featureGrid");
    expect(homepageContent).not.toHaveProperty("homepageExperience.carousel");
  });

  it("does not reintroduce rejected carousel or placeholder signals", () => {
    const content = JSON.stringify(homepageContent);
    expect(content).not.toContain("feedback@busiscoming.local");
    expect(content).not.toContain("autoAdvanceMs");
    expect(content).not.toContain("stair-card-deck");
    expect(content).not.toContain("lightbox");
  });

  it("retires the independent Header contract without losing support actions", () => {
    expect(homepageContent).not.toHaveProperty("navigation");
    expect(homepageContent.siteChrome.languageOptions).toEqual({ "zh-Hant": "繁", "zh-Hans": "简", en: "EN" });
    expect(homepageContent.supportEnding.contact.target).toBe("mailto:hezhenyu966@gmail.com");
    expect(homepageContent.supportEnding.privacyLink.href.en).toBe("/en/privacy/");
  });
});
