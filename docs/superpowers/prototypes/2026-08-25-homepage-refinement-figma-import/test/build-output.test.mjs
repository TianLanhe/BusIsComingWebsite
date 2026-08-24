import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const outputUrl = new URL("../dist/code.js", import.meta.url);

test("build output is a standalone Figma plugin with native design primitives", async () => {
  const output = await readFile(outputUrl, "utf8");
  assert.match(output, /figma\.variables\.createVariableCollection/);
  assert.match(output, /figma\.createComponent/);
  assert.match(output, /figma\.combineAsVariants/);
  assert.match(output, /addComponentProperty/);
  assert.match(output, /figma\.createImage/);
  assert.match(output, /imageHash:\s*ASSETS\[imageName\]\.hash/);
  assert.doesNotMatch(output, /imageRef:/);
  assert.match(output, /Homepage refinement 2026-08-25 — FINAL/);
  assert.match(output, /text-overflow-geometry-only/);
  assert.match(output, /scroll-to-#download/);
  assert.doesNotMatch(output, /2026\.08\.18|18\/08\/2026/);
  assert.doesNotMatch(output, /(?:\/Users\/|\/private\/var\/|AndroidStudioProjects)/);
  assert.doesNotMatch(output, /\n\n$/);
});

test("keeps the route title, description, and panels from overlapping", async () => {
  const output = await readFile(outputUrl, "utf8");
  assert.match(output, /function repairRouteTrialSpacing/);
  assert.match(output, /Description"[^\n]+20, 126, 350/);
  assert.match(output, /Query Panel"[^\n]+16, 158, 358, 224/);
  assert.match(output, /Route Result"[^\n]+16, 394, 358, 421/);
});

test("keeps the mobile download heading and description from overlapping", async () => {
  const output = await readFile(outputUrl, "utf8");
  assert.match(output, /function repairMobileDownloadSpacing/);
  assert.match(output, /mobile \? 171 : 214/);
  assert.match(output, /mobile \? 209 : 267/);
  assert.match(output, /32, 242, 326, 58/);
});
