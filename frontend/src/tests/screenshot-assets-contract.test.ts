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
  const approvedSources = {
    "route-search": {
      zh: { sourceFileName: "01-search-freely-raw.png", height: 2172, sha256: "d9621d2a93b348d01eb83ce4917bc5d0b249e5d24d9ce7450aa57384a0c74989" },
      en: { sourceFileName: "01-search-freely-raw.png", height: 2172, sha256: "c61507546663f144a161146929f77bd06dd0c19d5c892ae57568fea3f07dcf9f" },
    },
    "saved-journeys": {
      zh: { sourceFileName: "02-saved-journey-raw.png", height: 2172, sha256: "f5ff363cc192ebca12b8426f9aebab3fad20565381365ba941e21529503c3eb9" },
      en: { sourceFileName: "02-saved-journey-raw.png", height: 2172, sha256: "c145f5aaaa67365b879c1502209731990ed018668b5bdcfdaf27e7faf433ccae" },
    },
    "journey-guidance": {
      zh: { sourceFileName: "03-route-detail-raw.png", height: 2172, sha256: "10db41131df140927ed347d7a83c26f83e23ee5344c6873c411b2062571bebfd" },
      en: { sourceFileName: "03-route-detail-raw.png", height: 2172, sha256: "c44f2233f5ae90b9c662e339a28873323752be0ba1f72b8e392b04aee35ecc6f" },
    },
    "cross-operator-arrivals": {
      zh: { sourceFileName: "04-cross-operator-arrivals-raw.png", height: 2172, sha256: "9af05fc114796d05e887b8b3dd1e2b127393efb9a7c2b23cd7e1476dc2ece4a1" },
      en: { sourceFileName: "04-cross-operator-arrivals-raw.png", height: 2172, sha256: "d0690de1a81b8f23b1e4c5be9eb80e2a0451b430247d336fa399cf575a2b1dbe" },
    },
    "predeparture-monitor": {
      zh: { sourceFileName: "05-lockscreen-expanded-raw.png", height: 2400, sha256: "1cda8c7ff30823be5b95498dfd640bf124f4e3886851cd5ab6ad7968c4afa1bd" },
      en: { sourceFileName: "05-monitor-lockscreen-raw.png", height: 2400, sha256: "7c1f8d1bcce3934e3594cdf609b98673f2509ec060c2aecf5b7d51037e099162" },
    },
  } as const;

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
      expect(asset.storyId in approvedSources, asset.storyId).toBe(true);
      const storyId = asset.storyId as keyof typeof approvedSources;
      for (const variant of ["zh", "en"] as const) {
        const approved = approvedSources[storyId][variant];
        expect(asset.variants[variant].sourceFileName).toBe(approved.sourceFileName);
        expect(asset.variants[variant].sourceFingerprint).toEqual({
          width: 1080,
          height: approved.height,
          sha256: approved.sha256,
        });
        expect(asset.variants[variant].outputs.map((output) => [output.width, output.height])).toEqual([
          [540, 1086], [720, 1448], [1080, 2172],
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

  it("uses only the lock-screen notification for story five", () => {
    const monitor = screenshotManifest.assets.find((asset) => asset.storyId === "predeparture-monitor");
    expect(monitor?.variants.zh.sourceFileName).toBe("05-lockscreen-expanded-raw.png");
    expect(monitor?.variants.en.sourceFileName).toBe("05-monitor-lockscreen-raw.png");
    expect(JSON.stringify(monitor)).not.toContain("monitor-settings");
  });

  it("contains no developer workstation or Android project path", () => {
    const manifest = JSON.stringify(screenshotManifest);
    expect(manifest).not.toContain("/Users/");
    expect(manifest).not.toContain("/private/var/");
    expect(manifest).not.toContain("AndroidStudioProjects");
    expect(manifest).not.toContain("sourcePath");
  });
});
