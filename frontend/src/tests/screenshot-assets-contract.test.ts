import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import screenshotManifestSchema from "../../../specs/015-refine-homepage-interactions/contracts/screenshot-assets-v131-localized.manifest.schema.json";
import screenshotManifest from "../assets/app-screenshots/real/manifest.json";
import { homepageStories } from "../content/homepageStories";

describe("v1.3.1 screenshot assets", () => {
  const ajv = new Ajv2020({ strict: false });
  ajv.addFormat("date", /^\d{4}-\d{2}-\d{2}$/);

  it("validates five stories with approved zh/en sources and locale mapping", () => {
    const validate = ajv.compile(screenshotManifestSchema);
    expect(validate(screenshotManifest), JSON.stringify(validate.errors, null, 2)).toBe(true);
    expect(screenshotManifest.assets.map((asset) => asset.storyId)).toEqual(homepageStories.map((story) => story.id));
    expect(screenshotManifest.schemaVersion).toBe("3.0.0");
    expect(screenshotManifest.localeVariantByLocale).toEqual({ "zh-Hant": "zh", "zh-Hans": "zh", en: "en" });
  });

  it("keeps every production derivative present and fingerprinted", () => {
    const paths = new Set<string>();
    for (const asset of screenshotManifest.assets) {
      for (const variant of ["zh", "en"] as const) {
        expect(asset.variants[variant].sourceFingerprint).toMatchObject({ width: 1080, height: 1920 });
        expect(asset.variants[variant].outputs.map((output) => [output.width, output.height])).toEqual([
          [540, 960], [720, 1280], [1080, 1920],
        ]);
        for (const output of asset.variants[variant].outputs) {
          expect(paths.has(output.assetPath), output.assetPath).toBe(false);
          paths.add(output.assetPath);
          const path = resolve(process.cwd(), "..", output.assetPath);
          const bytes = readFileSync(path);
          expect(statSync(path).size, output.assetPath).toBe(output.sizeBytes);
          expect(createHash("sha256").update(bytes).digest("hex"), output.assetPath).toBe(output.sha256);
        }
      }
    }
    expect(paths.size).toBe(30);
  });

  it("contains no developer workstation or Android project path", () => {
    const manifest = JSON.stringify(screenshotManifest);
    expect(manifest).not.toContain("/Users/");
    expect(manifest).not.toContain("/private/var/");
    expect(manifest).not.toContain("AndroidStudioProjects");
    expect(manifest).not.toContain("sourcePath");
  });
});
