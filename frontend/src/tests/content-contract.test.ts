import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import homepageContentSchema from "../../../shared/contracts/homepage-content.schema.json";
import privacyPolicyContentSchema from "../../../specs/008-privacy-policy-pages/contracts/privacy-policy-content.schema.json";
import { homepageContent } from "../content/homepageContent";
import { privacyPolicyContent } from "../content/privacyPolicyContent";
import { seoPageGroups } from "../content/seo";

describe("content contracts", () => {
  const ajv = new Ajv2020({ strict: false });
  ajv.addFormat("date", /^\d{4}-\d{2}-\d{2}$/);
  ajv.addFormat("uri", /^https?:\/\/.+/);

  it("validates the approved v4 homepage content", () => {
    const validate = ajv.compile(homepageContentSchema);
    expect(validate(homepageContent), JSON.stringify(validate.errors, null, 2)).toBe(true);
    expect(homepageContent.metadata.version).toBe("4.0.0");
    expect(homepageContent.hero.stories.map((story) => story.id)).toEqual([
      "route-search",
      "saved-journeys",
      "journey-guidance",
      "cross-operator-arrivals",
      "predeparture-monitor",
    ]);
  });

  it("keeps the new product position and approved interaction contract", () => {
    expect(homepageContent.hero.productPositioning.en).toContain("bus route planner");
    expect(homepageContent.hero.primaryAction.target).toBe("#download");
    expect(homepageContent.hero.secondaryAction.target).toBe("#route-trial");
    expect(homepageContent.hero.stories).toHaveLength(5);
    expect(homepageContent.hero.stories.map((story) => story.numberLabel)).toEqual(["01", "02", "03", "04", "05"]);
    expect(homepageContent.figmaReference.baseline).toEqual(expect.objectContaining({
      sectionNode: "119:64", desktopHeroNode: "119:176", mobileHeroNode: "119:461",
    }));
    expect(homepageContent.figmaReference.refinement).toEqual(expect.objectContaining({
      sectionNode: "136:292", desktopHeroNode: "136:341", mobileHeroNode: "136:439", narrowHeroNode: "136:484",
    }));
    expect(homepageContent).toHaveProperty("siteChrome.brandAssetId", "busiscoming-app-logo");
    expect(homepageContent).not.toHaveProperty("navigation");
    expect(homepageContent.downloadDecision.metadataLabels).not.toHaveProperty("updated");
  });

  it("keeps the public trial bounded without reverting to a Citybus-only product", () => {
    const homepage = JSON.stringify(homepageContent);
    expect(homepageContent.scopeExclusions.map((item) => item.en).join(" ")).toContain("MTR");
    expect(homepageContent.scopeExclusions.map((item) => item.en).join(" ")).toContain("ferry");
    expect(homepage).not.toContain("feedback@busiscoming.local");
    expect(homepage).not.toContain("Citybus route trial only");
    expect(homepage).not.toContain("static demo");
  });

  it("validates the existing privacy policy and localized links", () => {
    const validate = ajv.compile(privacyPolicyContentSchema);
    const footerPrivacyLinks = {
      "zh-Hant": { label: homepageContent.supportEnding.privacyLink.label["zh-Hant"], href: homepageContent.supportEnding.privacyLink.href["zh-Hant"] },
      "zh-Hans": { label: homepageContent.supportEnding.privacyLink.label["zh-Hans"], href: homepageContent.supportEnding.privacyLink.href["zh-Hans"] },
      en: { label: homepageContent.supportEnding.privacyLink.label.en, href: homepageContent.supportEnding.privacyLink.href.en },
    };
    expect(validate({ privacyPolicy: privacyPolicyContent, seoPageGroups, footerPrivacyLinks }), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });
});
