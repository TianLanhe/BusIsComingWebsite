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

test("pins every approved localized screenshot and the real app logo", () => {
  assert.match(DESIGN_CONTRACT.brand.imageSha256, /^[a-f0-9]{64}$/);
  const hashes = [];
  for (const story of DESIGN_CONTRACT.stories) {
    for (const variant of Object.values(story.screenshots)) {
      assert.match(variant.sha256, /^[a-f0-9]{64}$/);
      hashes.push(variant.sha256);
    }
  }
  assert.equal(new Set(hashes).size, 10);
});
