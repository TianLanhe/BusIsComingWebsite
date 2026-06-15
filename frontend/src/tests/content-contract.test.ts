import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import downloadManifestSchema from "../../../shared/contracts/download-manifest.schema.json";
import homepageContentSchema from "../../../shared/contracts/homepage-content.schema.json";
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

  it("validates download manifest against the shared contract", () => {
    const validate = ajv.compile(downloadManifestSchema);
    expect(validate(downloadManifest), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });
});
