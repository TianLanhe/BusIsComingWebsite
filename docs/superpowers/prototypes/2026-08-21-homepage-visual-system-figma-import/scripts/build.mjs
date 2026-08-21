import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { DESIGN_CONTRACT } from "../src/design-contract.mjs";

const pluginRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceTemplate = fileURLToPath(new URL("../src/plugin-template.js", import.meta.url));
const defaultScreenshotRoot = fileURLToPath(new URL("../../../../../.superpowers/brainstorm/39893-1787244865/content/", import.meta.url));
const screenshotRoot = process.env.BIC_FIGMA_SCREENSHOT_DIR || defaultScreenshotRoot;
const outputDirectory = fileURLToPath(new URL("../dist/", import.meta.url));
const outputFile = fileURLToPath(new URL("../dist/code.js", import.meta.url));

const template = await readFile(sourceTemplate, "utf8");
const images = {};

for (const story of DESIGN_CONTRACT.stories) {
  const source = new URL(story.image, `file://${screenshotRoot.replace(/\/$/, "")}/`);
  const bytes = await readFile(source);
  const digest = createHash("sha256").update(bytes).digest("hex");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (digest !== story.imageSha256 || width !== story.imageWidth || height !== story.imageHeight) {
    throw new Error(`Approved screenshot contract mismatch: ${story.image}`);
  }
  images[story.image] = bytes.toString("base64");
}

const output = template
  .replace("__DESIGN_CONTRACT__", JSON.stringify(DESIGN_CONTRACT))
  .replace("__IMAGE_BASE64__", JSON.stringify(images));

if (output.includes("__DESIGN_CONTRACT__") || output.includes("__IMAGE_BASE64__")) {
  throw new Error("Figma plugin template still contains unresolved build markers.");
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputFile, `${output.trimEnd()}\n`, "utf8");
process.stdout.write(`Built ${outputFile}\n`);
