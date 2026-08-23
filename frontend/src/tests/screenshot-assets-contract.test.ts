import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import screenshotManifestSchema from "../../../specs/014-upgrade-homepage-visual-system/contracts/screenshot-assets-v131.manifest.schema.json";
import screenshotManifest from "../assets/app-screenshots/real/manifest.json";
import { homepageStories } from "../content/homepageStories";

describe("v1.3.1 screenshot assets", () => {
  const ajv = new Ajv2020({ strict: false });
  ajv.addFormat("date", /^\d{4}-\d{2}-\d{2}$/);

  it("validates the five approved sources and responsive outputs", () => {
    const validate = ajv.compile(screenshotManifestSchema);
    expect(validate(screenshotManifest), JSON.stringify(validate.errors, null, 2)).toBe(true);
    expect(screenshotManifest.assets.map((asset) => asset.storyId)).toEqual(homepageStories.map((story) => story.id));
  });

  it("keeps every production derivative present and fingerprinted", () => {
    for (const asset of screenshotManifest.assets) {
      expect(asset.outputs.map((output) => output.width)).toEqual([540, 720, 1080]);
      for (const output of asset.outputs) {
        const path = resolve(process.cwd(), "..", output.assetPath);
        const bytes = readFileSync(path);
        expect(statSync(path).size, output.assetPath).toBe(output.sizeBytes);
        expect(createHash("sha256").update(bytes).digest("hex"), output.assetPath).toBe(output.sha256);
      }
    }
  });

  it("contains no developer workstation or Android project path", () => {
    const manifest = JSON.stringify(screenshotManifest);
    expect(manifest).not.toContain("/Users/");
    expect(manifest).not.toContain("/private/var/");
    expect(manifest).not.toContain("AndroidStudioProjects");
    expect(manifest).not.toContain("sourcePath");
  });
});
