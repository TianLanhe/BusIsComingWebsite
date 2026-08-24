import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { homepageContent } from "../content/homepageContent";
import { storyAssets } from "../content/storyAssets";

describe("homepage visual system contract", () => {
  it("pins the approved Figma nodes, five stories, and four-section narrative", () => {
    expect(homepageContent.figmaReference.baseline).toMatchObject({ sectionNode: "119:64", desktopHeroNode: "119:176", mobileHeroNode: "119:461" });
    expect(homepageContent.figmaReference.refinement).toMatchObject({ sectionNode: "136:292", desktopHeroNode: "136:341", mobileHeroNode: "136:439", narrowHeroNode: "136:484" });
    expect(homepageContent.hero.stories).toHaveLength(5);
    expect(Object.keys(storyAssets)).toHaveLength(5);
    expect([homepageContent.hero, homepageContent.routeTrial, homepageContent.downloadDecision, homepageContent.supportEnding]).toHaveLength(4);
  });

  it("keeps runtime content free of local paths and private digest copy", () => {
    const runtime = JSON.stringify(homepageContent);
    expect(runtime).not.toMatch(/\/Users\/|\/private\/var\/|BusIsComming/);
    expect(runtime).not.toMatch(/SHA.?256|BUILD 19|目前版本可下載/);
    const manifest = readFileSync(path.resolve("src/assets/app-screenshots/real/manifest.json"), "utf8");
    expect(manifest).not.toMatch(/\/Users\/|\/private\/var\//);
  });
});
