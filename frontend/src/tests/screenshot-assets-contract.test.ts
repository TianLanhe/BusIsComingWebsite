import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import screenshotManifestSchema from "../../../specs/003-homepage-ui-optimization/contracts/screenshot-assets.manifest.schema.json";
import screenshotManifest from "../assets/app-screenshots/real/manifest.json";
import { carouselSlides } from "../content/carouselSlides";
import { locales } from "../content/locales";

describe("screenshot assets manifest", () => {
  const ajv = new Ajv2020({ strict: false });

  it("validates the manifest against the feature contract", () => {
    const validate = ajv.compile(screenshotManifestSchema);

    expect(validate(screenshotManifest), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it("keeps the user-confirmed scene mapping and default images", () => {
    expect(screenshotManifest.groups).toHaveLength(4);

    expect(screenshotManifest.sourceRoot).toBe("frontend/src/assets/app-screenshots/real");
    expect(screenshotManifest.groups.map((group) => [group.featureId, group.images.map((image) => image.id)])).toEqual([
      ["favorite-citybus-routes", ["home-favorites-results", "home-all-routes-sheet"]],
      ["route-comparison", ["home-favorites-results"]],
      ["eta-details", ["route-detail-expanded", "eta-arrivals-sheet"]],
      ["predeparture-monitor", ["lockscreen-monitor"]],
    ]);

    for (const group of screenshotManifest.groups) {
      const defaultImage = group.images.find((image) => image.isDefault);
      expect(defaultImage?.order, `${group.featureId} default order`).toBe(1);
      expect(defaultImage?.sourcePath.endsWith(group.defaultSourceFile), `${group.featureId} default source`).toBe(true);
      expect(group.images.filter((image) => image.isDefault), `${group.featureId} default count`).toHaveLength(1);

      for (const image of group.images) {
        expect(image.desensitizationStatus, image.id).toBe("approved");
        expect(image.sourcePath.startsWith("frontend/src/assets/app-screenshots/real/"), image.id).toBe(true);
        expect(image.outputPath.endsWith(".png"), image.id).toBe(true);
        expect(image.retainedItems, image.id).toContain("price-time-eta-values");
      }
    }
  });

  it("exposes cinematic rail galleries with approved assets and complete alt text", () => {
    for (const slide of carouselSlides) {
      const defaultImage = slide.gallery.images.find((image) => image.id === slide.gallery.defaultImageId);

      expect(slide.gallery.manualOnly, slide.id).toBe(true);
      expect(slide.gallery.visualMode, slide.id).toBe("cinematic-phone-rail");
      expect(slide.gallery.allowThumbnailControls, slide.id).toBe(false);
      expect(defaultImage, `${slide.id} default image`).toBeTruthy();
      expect(defaultImage?.desensitizationStatus, `${slide.id} status`).toBe("approved");

      for (const image of slide.gallery.images) {
        for (const locale of locales) {
          expect(image.alt[locale], `${image.id} ${locale} alt`).toEqual(expect.any(String));
          expect(image.alt[locale].trim().length, `${image.id} ${locale} alt`).toBeGreaterThan(0);
        }
      }
    }
  });
});
