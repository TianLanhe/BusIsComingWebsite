import assert from "node:assert/strict";
import test from "node:test";

import { DESIGN_CONTRACT } from "../src/design-contract.mjs";

test("locks the approved desktop and mobile viewports", () => {
  assert.deepEqual(DESIGN_CONTRACT.viewports, {
    desktop: { width: 1440, height: 960 },
    mobile: { width: 390, height: 844 },
    narrow: { width: 320, height: 844 },
  });
});

test("contains the five approved hero stories in order", () => {
  assert.deepEqual(
    DESIGN_CONTRACT.stories.map(({ id, number }) => ({ id, number })),
    [
      { id: "route-search", number: "01" },
      { id: "saved-journeys", number: "02" },
      { id: "journey-guidance", number: "03" },
      { id: "cross-operator-arrivals", number: "04" },
      { id: "predeparture-monitor", number: "05" },
    ],
  );
});

test("locks dwell and stage-first motion timing", () => {
  assert.equal(DESIGN_CONTRACT.motion.firstDwellMs, 10000);
  assert.equal(DESIGN_CONTRACT.motion.cadenceDwellMs, 5000);
  assert.equal(DESIGN_CONTRACT.motion.resumedDwellMs, 10000);
  assert.equal(DESIGN_CONTRACT.motion.stageDurationMs, 820);
  assert.equal(DESIGN_CONTRACT.motion.textDelayMs, 160);
  assert.equal(DESIGN_CONTRACT.motion.easing, "cubic-bezier(.22,1,.36,1)");
});

test("uses textual route metrics and removes disallowed summary labels", () => {
  const serialized = JSON.stringify(DESIGN_CONTRACT);
  assert.match(serialized, /耗時 26 分鐘/);
  assert.match(serialized, /步行 180 米/);
  assert.doesNotMatch(serialized, /🕒|🚶|直達|轉乘標籤/);
});

test("locks the approved desktop and mobile download split", () => {
  assert.equal(DESIGN_CONTRACT.downloadBehavior.desktopHero, "scroll-to-download-section");
  assert.equal(DESIGN_CONTRACT.downloadBehavior.mobileHeroReady, "direct-apk-download");
  assert.equal(DESIGN_CONTRACT.downloadBehavior.sharedTarget, "metadata.downloadUrl");
  assert.deepEqual(DESIGN_CONTRACT.downloadBehavior.hiddenMetadata, ["updated"]);
});

test("keeps zh-Hans out of pixel-level Figma claims", () => {
  assert.deepEqual(DESIGN_CONTRACT.localeReferencePolicy, {
    "zh-Hant": "pixel-reference",
    en: "pixel-reference",
    "zh-Hans": "text-overflow-geometry-only",
  });
});

test("defines complete zh-Hant and en pixel-reference coverage", () => {
  assert.ok(Array.isArray(DESIGN_CONTRACT.referenceFrames), "referenceFrames must be defined");
  assert.deepEqual(
    DESIGN_CONTRACT.referenceFrames.map(({ viewport, locale, story, state }) => ({
      viewport,
      locale,
      story,
      state,
    })),
    [
      { viewport: "desktop", locale: "zh-Hant", story: "01", state: "settled" },
      { viewport: "desktop", locale: "en", story: "01", state: "settled" },
      { viewport: "mobile", locale: "zh-Hant", story: "01", state: "settled" },
      { viewport: "mobile", locale: "en", story: "01", state: "settled" },
      { viewport: "narrow", locale: "zh-Hant", story: "01", state: "settled" },
      { viewport: "narrow", locale: "en", story: "01", state: "settled" },
      { viewport: "mobile", locale: "zh-Hant", story: "02", state: "reduced-motion-settled" },
      { viewport: "mobile", locale: "en", story: "02", state: "reduced-motion-settled" },
    ],
  );
  assert.equal(DESIGN_CONTRACT.existingSectionPolicy, "idempotent-reference-backfill-and-screenshot-refresh");
});

test("pins every approved localized screenshot and the real app logo", () => {
  assert.match(DESIGN_CONTRACT.brand.imageSha256, /^[a-f0-9]{64}$/);
  const hashes = [];
  const assetKeys = [];
  for (const story of DESIGN_CONTRACT.stories) {
    for (const variant of Object.values(story.screenshots)) {
      assert.match(variant.sha256, /^[a-f0-9]{64}$/);
      assert.match(variant.assetKey, /^[a-z-]+:(?:zh|en)$/);
      hashes.push(variant.sha256);
      assetKeys.push(variant.assetKey);
    }
  }
  assert.equal(new Set(hashes).size, 10);
  assert.equal(new Set(assetKeys).size, 10, "localized screenshot assets must never share an embedded-image key");
});

test("pins the corrected raw screenshot set and uses only the lock-screen image for story five", () => {
  assert.deepEqual(
    DESIGN_CONTRACT.stories.map((story) => ({
      id: story.id,
      zh: story.screenshots.zh.image,
      en: story.screenshots.en.image,
      zhHeight: story.screenshots.zh.height,
      enHeight: story.screenshots.en.height,
    })),
    [
      { id: "route-search", zh: "01-search-freely-raw.png", en: "01-search-freely-raw.png", zhHeight: 2172, enHeight: 2172 },
      { id: "saved-journeys", zh: "02-saved-journey-raw.png", en: "02-saved-journey-raw.png", zhHeight: 2172, enHeight: 2172 },
      { id: "journey-guidance", zh: "03-route-detail-raw.png", en: "03-route-detail-raw.png", zhHeight: 2172, enHeight: 2172 },
      { id: "cross-operator-arrivals", zh: "04-cross-operator-arrivals-raw.png", en: "04-cross-operator-arrivals-raw.png", zhHeight: 2172, enHeight: 2172 },
      { id: "predeparture-monitor", zh: "05-lockscreen-expanded-raw.png", en: "05-monitor-lockscreen-raw.png", zhHeight: 2400, enHeight: 2400 },
    ],
  );
  assert.doesNotMatch(JSON.stringify(DESIGN_CONTRACT.stories), /monitor-settings/);
});
