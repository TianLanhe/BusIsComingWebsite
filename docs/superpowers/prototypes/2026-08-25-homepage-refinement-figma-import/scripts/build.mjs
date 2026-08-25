import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { DESIGN_CONTRACT } from "../src/design-contract.mjs";

const pluginRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceTemplate = fileURLToPath(new URL("../src/plugin-template.js", import.meta.url));
const outputDirectory = fileURLToPath(new URL("../dist/", import.meta.url));
const outputFile = fileURLToPath(new URL("../dist/code.js", import.meta.url));
const brandRoot = fileURLToPath(new URL("../../../../../frontend/src/assets/brand/", import.meta.url));
const zhRoot = process.env.BIC_FIGMA_ZH_SCREENSHOT_DIR;
const enRoot = process.env.BIC_FIGMA_EN_SCREENSHOT_DIR;

if (!zhRoot || !enRoot) {
  throw new Error("BIC_FIGMA_ZH_SCREENSHOT_DIR and BIC_FIGMA_EN_SCREENSHOT_DIR are required.");
}

const template = await readFile(sourceTemplate, "utf8");
const images = {};
const execFileAsync = promisify(execFile);
const requireFromFrontend = createRequire(new URL("../../../../../frontend/package.json", import.meta.url));
const sharp = requireFromFrontend("sharp");

async function convertWebpToPng(sourcePath) {
  const tempDirectory = await mkdtemp(join(tmpdir(), "bic-figma-logo-"));
  const outputPath = join(tempDirectory, "brand.png");
  try {
    await execFileAsync("sips", ["-s", "format", "png", sourcePath, "--out", outputPath]);
    return await readFile(outputPath);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

async function loadImage(root, contract, assetKey = contract.image) {
  const sourcePath = `${root.replace(/\/$/, "")}/${contract.image}`;
  const bytes = await readFile(sourcePath);
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== contract.sha256) throw new Error(`Approved asset contract mismatch: ${contract.image}`);
  let embeddedBytes = contract.image.endsWith(".webp") ? await convertWebpToPng(sourcePath) : bytes;
  const isPng = embeddedBytes.subarray(1, 4).toString("ascii") === "PNG";
  if (isPng) {
    const width = embeddedBytes.readUInt32BE(16);
    const height = embeddedBytes.readUInt32BE(20);
    const expectedWidth = contract.width || 1080;
    const expectedHeight = contract.height || 2172;
    if (width !== expectedWidth || height !== expectedHeight) throw new Error(`Approved asset dimensions mismatch: ${contract.image}`);
    if (expectedWidth === 1080 && expectedHeight > 2172) {
      embeddedBytes = await sharp(embeddedBytes)
        .extract({ left: 0, top: 0, width: 1080, height: 2172 })
        .png()
        .toBuffer();
    }
  }
  images[assetKey] = embeddedBytes.toString("base64");
}

await loadImage(brandRoot, {
  image: DESIGN_CONTRACT.brand.image,
  sha256: DESIGN_CONTRACT.brand.imageSha256,
  width: DESIGN_CONTRACT.brand.imageWidth,
  height: DESIGN_CONTRACT.brand.imageHeight,
});

for (const story of DESIGN_CONTRACT.stories) {
  await loadImage(zhRoot, story.screenshots.zh, story.screenshots.zh.assetKey);
  await loadImage(enRoot, story.screenshots.en, story.screenshots.en.assetKey);
}

const output = template
  .replace("__DESIGN_CONTRACT__", JSON.stringify(DESIGN_CONTRACT))
  .replace("__IMAGE_BASE64__", JSON.stringify(images));

if (output.includes("__DESIGN_CONTRACT__") || output.includes("__IMAGE_BASE64__")) {
  throw new Error("Figma plugin template still contains unresolved build markers.");
}
if (output.includes(zhRoot) || output.includes(enRoot)) {
  throw new Error("Generated plugin leaked a one-time source directory.");
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputFile, `${output.trimEnd()}\n`, "utf8");
process.stdout.write(`Built ${outputFile}\n`);
