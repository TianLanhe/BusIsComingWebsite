import { describe, expect, it } from "vitest";
import { monitoringCopyCatalog, accessibilityCopy } from "./copy";
import { detailCopy, eventLabels } from "./types";

const locales = ["zh-Hant", "zh-Hans", "en"] as const;

describe("monitoring copy completeness", () => {
  it("keeps the same non-empty navigation, filter, chart, state, and error keys in all locales", () => {
    const expected = Object.keys(monitoringCopyCatalog["zh-Hans"]).sort();
    for (const locale of locales) {
      expect(Object.keys(monitoringCopyCatalog[locale]).sort()).toEqual(expected);
      for (const value of Object.values(monitoringCopyCatalog[locale])) expect(value.trim()).not.toBe("");
    }
  });

  it("keeps detailed workspaces, event labels, and accessibility copy complete", () => {
    const detailKeys = Object.keys(detailCopy.en).sort();
    for (const locale of locales) {
      expect(Object.keys(detailCopy[locale]).sort()).toEqual(detailKeys);
      expect(Object.keys(accessibilityCopy[locale]).sort()).toEqual(Object.keys(accessibilityCopy.en).sort());
      for (const label of Object.values(eventLabels)) expect(label[locale]).not.toBe("");
    }
  });

  it("states the same privacy and metric boundaries without implying people, installs, or IP storage", () => {
    for (const locale of locales) {
      const text = `${monitoringCopyCatalog[locale].downloadNote} ${monitoringCopyCatalog[locale].visitorTransport} ${detailCopy[locale].privacyDetail}`.toLowerCase();
      expect(text).toMatch(/ip/);
      expect(text).toMatch(/cookie/);
      expect(text).toMatch(/install|安裝|安装/);
      expect(text).toMatch(/query|查詢|查询/);
    }
  });
});
