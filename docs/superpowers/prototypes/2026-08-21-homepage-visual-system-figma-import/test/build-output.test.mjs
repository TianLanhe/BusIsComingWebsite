import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const outputUrl = new URL("../dist/code.js", import.meta.url);

test("build output is a standalone Figma plugin with native design primitives", async () => {
  const output = await readFile(outputUrl, "utf8");
  assert.match(output, /figma\.variables\.createVariableCollection/);
  assert.match(output, /figma\.createComponent/);
  assert.match(output, /figma\.combineAsVariants/);
  assert.match(output, /layoutVariantSet/);
  assert.match(output, /addComponentProperty/);
  assert.match(output, /figma\.createImage/);
  assert.match(output, /imageHash:\s*ASSETS\[imageKey\]\.hash/);
  assert.doesNotMatch(output, /imageRef:/);
  assert.match(output, /Homepage Visual System v1\.3\.1 — FINAL/);
  assert.doesNotMatch(output, /\/Users\/hezhenyu\/AndroidStudioProjects\/BusIsComming/);
  assert.doesNotMatch(output, /\n\n$/);
});
