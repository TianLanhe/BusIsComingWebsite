import assert from "node:assert/strict";
import test from "node:test";

import { DESIGN_CONTRACT } from "../src/design-contract.mjs";

test("locks the approved desktop and mobile viewports", () => {
  assert.deepEqual(DESIGN_CONTRACT.viewports, {
    desktop: { width: 1440, height: 960 },
    mobile: { width: 390, height: 844 },
  });
});

test("contains the five approved hero stories in order", () => {
  assert.deepEqual(
    DESIGN_CONTRACT.stories.map(({ id, label, title, description }) => ({ id, label, title, description })),
    [
      { id: "01", label: "搜尋", title: "隨心搜尋，出發更輕鬆", description: "輸入起終點，即時比較合適路線" },
      { id: "02", label: "行程", title: "常走的路，一按更省心", description: "路線、車費與候車時間集中比較，選擇更清楚" },
      { id: "03", label: "沿途", title: "一路看清，出行更安心", description: "路線、轉乘與目前位置，沿途心中有數" },
      { id: "04", label: "班次", title: "班次看得全，候車更從容", description: "城巴、九巴與龍運到站時間集中呈現" },
      { id: "05", label: "出門", title: "不用盯手機，出門更有把握", description: "啟動一次，鎖屏持續更新候車與步行時間" },
    ],
  );
});

test("locks route and download state matrices", () => {
  assert.deepEqual(DESIGN_CONTRACT.states.route, ["idle", "loading", "success", "empty", "error", "retained"]);
  assert.deepEqual(DESIGN_CONTRACT.states.download, ["checking", "ready", "unavailable", "reduced-motion"]);
});

test("uses textual route metrics and removes disallowed summary labels", () => {
  const serialized = JSON.stringify(DESIGN_CONTRACT);
  assert.match(serialized, /耗時 26 分鐘/);
  assert.match(serialized, /步行 180 米/);
  assert.doesNotMatch(serialized, /🕒|🚶|直達|轉乘標籤/);
});

test("prohibits dynamic islands, purple blocks, dark footer tides, and stale product positioning", () => {
  assert.deepEqual(DESIGN_CONTRACT.prohibited, [
    "dynamic-island",
    "purple-block",
    "dark-footer-tide",
    "Citybus-only-positioning",
    "feature-evidence-label",
    "feature-01-search-label",
    "mobile-explanation-card",
  ]);
});

test("keeps full mobile navigation and a stage-first story order", () => {
  assert.deepEqual(DESIGN_CONTRACT.navigation, ["功能", "常見問題", "聯絡我們", "繁體"]);
  assert.deepEqual(DESIGN_CONTRACT.mobileHeroOrder, ["navigation", "copy", "actions", "phone-stage", "story-rail"]);
});

test("uses the approved motion timings and reduced motion behavior", () => {
  assert.equal(DESIGN_CONTRACT.motion.orbit.durationMs, 880);
  assert.equal(DESIGN_CONTRACT.motion.orbit.easing, "cubic-bezier(.18,.82,.18,1)");
  assert.equal(DESIGN_CONTRACT.motion.reducedMotion, "swap-depth-without-orbit");
});

test("pins every approved screenshot by SHA-256 and native dimensions", () => {
  assert.equal(new Set(DESIGN_CONTRACT.stories.map((story) => story.imageSha256)).size, 5);
  for (const story of DESIGN_CONTRACT.stories) {
    assert.match(story.imageSha256, /^[a-f0-9]{64}$/);
    assert.equal(story.imageWidth, 1080);
    assert.equal(story.imageHeight, story.id === "05" ? 2400 : 2172);
  }
});
