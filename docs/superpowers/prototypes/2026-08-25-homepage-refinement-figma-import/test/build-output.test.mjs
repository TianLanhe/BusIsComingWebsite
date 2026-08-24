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
