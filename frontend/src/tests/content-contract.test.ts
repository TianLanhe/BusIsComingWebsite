import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import downloadManifestSchema from "../../../shared/contracts/download-manifest.schema.json";
import homepageContentSchema from "../../../shared/contracts/homepage-content.schema.json";
import homepageContentV2Schema from "../../../specs/003-homepage-ui-optimization/contracts/homepage-content-v2.schema.json";
import { downloadManifest } from "../content/downloadManifest";
import { homepageContent } from "../content/homepageContent";

describe("content contracts", () => {
  const ajv = new Ajv2020({ strict: false });
  ajv.addFormat("date", /^\d{4}-\d{2}-\d{2}$/);
  ajv.addFormat("uri", /^https?:\/\/.+/);

  it("validates homepage content against the shared contract", () => {
    const validate = ajv.compile(homepageContentSchema);
    expect(validate(homepageContent), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it("validates homepage v2 content against the feature contract", () => {
    const validate = ajv.compile(homepageContentV2Schema);
    const actionForContract = (action: typeof homepageContent.hero.primaryAction) => ({
      label: action.label,
      target: action.target,
      kind: action.kind,
    });
    const homepageV2 = {
      metadata: homepageContent.metadata,
      hero: {
        headline: homepageContent.hero.headline,
        subheading: homepageContent.hero.subheading,
        primaryAction: actionForContract(homepageContent.hero.primaryAction),
        secondaryAction: actionForContract(homepageContent.hero.secondaryAction),
        apkMeta: homepageContent.hero.apkMeta,
        iphoneStatus: homepageContent.hero.iphoneStatus,
      },
      featureShowcase: homepageContent.featureShowcase.map((item) => ({
        id: item.id,
        order: item.order,
        title: item.title,
        description: item.description,
        gallery: {
          defaultImageId: item.gallery.defaultImageId,
          manualOnly: item.gallery.manualOnly,
          images: item.gallery.images.map((image) => ({
            id: image.id,
            assetPath: image.assetPath,
            order: image.order,
            isDefault: image.isDefault,
            alt: image.alt,
          })),
        },
        sourceReference: item.sourceReference,
      })),
      features: homepageContent.features,
      downloadSection: {
        title: homepageContent.downloadSection.title,
        description: homepageContent.downloadSection.description,
        androidCard: {
          title: homepageContent.downloadSection.androidCard.title,
          meta: homepageContent.downloadSection.androidCard.meta,
          primaryAction: actionForContract(homepageContent.downloadSection.androidCard.primaryAction),
          backupAction: actionForContract(homepageContent.downloadSection.androidCard.backupAction),
        },
        iphoneStatus: homepageContent.downloadSection.iphoneStatus,
      },
      scopeExclusions: homepageContent.scopeExclusions,
      figmaReference: homepageContent.figmaReference,
    };

    expect(validate(homepageV2), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it("validates download manifest against the shared contract", () => {
    const validate = ajv.compile(downloadManifestSchema);
    expect(validate(downloadManifest), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });
});
