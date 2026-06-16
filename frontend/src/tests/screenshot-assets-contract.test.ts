import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import screenshotManifestSchema from "../../../specs/003-homepage-ui-optimization/contracts/screenshot-assets.manifest.schema.json";
import screenshotManifest from "../assets/app-screenshots/real/manifest.json";

describe("sanitized screenshot assets manifest", () => {
  const ajv = new Ajv2020({ strict: false });

  it("validates the manifest against the feature contract", () => {
    const validate = ajv.compile(screenshotManifestSchema);

    expect(validate(screenshotManifest), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it("keeps every gallery manual-only with image 1 as the default approved asset", () => {
    expect(screenshotManifest.groups).toHaveLength(4);

    for (const group of screenshotManifest.groups) {
      const defaultImage = group.images.find((image) => image.isDefault);
      expect(defaultImage?.order, `${group.featureId} default order`).toBe(1);
      expect(defaultImage?.sourcePath.endsWith(group.defaultSourceFile), `${group.featureId} default source`).toBe(true);

      for (const image of group.images) {
        expect(image.desensitizationStatus, image.id).toBe("approved");
        expect(image.redactedItems, image.id).toEqual(
          expect.arrayContaining([
            "real-place-name",
            "real-stop-name",
            "real-route-number",
            "search-history",
            "phone-system-content",
          ]),
        );
        expect(image.retainedItems, image.id).toContain("price-time-eta-values");
      }
    }
  });
});
