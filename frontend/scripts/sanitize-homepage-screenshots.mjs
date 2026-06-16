import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const manifestPath = path.resolve(scriptDir, "../src/assets/app-screenshots/real/manifest.json");

const maskPlan = {
  "favorite-citybus-routes": [
    rect(0, 0, 1200, 150, "#f4f8f7", 0.96),
    rect(56, 565, 330, 205),
    rect(410, 565, 330, 205),
    rect(770, 565, 330, 205),
    rect(55, 1180, 900, 1120),
  ],
  "route-comparison": [
    rect(0, 0, 1200, 150, "#f7faf9", 0.96),
    rect(56, 565, 330, 205),
    rect(410, 565, 330, 205),
    rect(770, 565, 330, 205),
    rect(60, 1245, 430, 165, "#f8fbfa", 1),
    rect(60, 1390, 760, 125, "#f8fbfa", 1),
    rect(360, 1325, 260, 75, "#f8fbfa", 1),
    rect(60, 1635, 430, 165, "#f8fbfa", 1),
    rect(60, 1780, 760, 125, "#f8fbfa", 1),
    rect(360, 1715, 260, 75, "#f8fbfa", 1),
    rect(60, 2030, 430, 165, "#f8fbfa", 1),
    rect(60, 2175, 760, 125, "#f8fbfa", 1),
    rect(360, 2110, 260, 75, "#f8fbfa", 1),
    rect(60, 2425, 430, 165, "#f8fbfa", 1),
    rect(60, 2570, 760, 90, "#f8fbfa", 1),
    rect(360, 2505, 260, 75, "#f8fbfa", 1),
  ],
  "eta-details": [
    rect(0, 0, 1200, 145, "#f4f8f7", 0.96),
    rect(56, 565, 330, 205),
    rect(410, 565, 330, 205),
    rect(770, 565, 330, 205),
    rect(58, 1245, 210, 95),
    rect(165, 1505, 155, 88),
    rect(165, 1620, 760, 650),
  ],
  "predeparture-monitor": [
    rect(520, 260, 580, 95, "#dfe8e5", 0.9),
    rect(205, 430, 230, 70, "#ffffff", 0.95),
  ],
};

function rect(x, y, width, height, fill = "#eef5f3", opacity = 0.98) {
  return { x, y, width, height, fill, opacity };
}

function svgOverlay(width, height, masks) {
  const blocks = masks
    .map(
      (mask) =>
        `<rect x="${mask.x}" y="${mask.y}" width="${mask.width}" height="${mask.height}" rx="22" fill="${mask.fill}" fill-opacity="${mask.opacity}"/>`,
    )
    .join("");

  return Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${blocks}</svg>`,
  );
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  for (const group of manifest.groups) {
    for (const image of group.images) {
      const source = path.resolve(repoRoot, image.sourcePath);
      const output = path.resolve(repoRoot, image.outputPath);
      const meta = await sharp(source).rotate().metadata();
      const width = meta.width ?? 1200;
      const height = meta.height ?? 2670;
      const masks = maskPlan[group.featureId] ?? [];

      const redacted = await sharp(source)
        .rotate()
        .composite([{ input: svgOverlay(width, height, masks), left: 0, top: 0 }])
        .jpeg({ quality: 90 })
        .toBuffer();

      await sharp(redacted)
        .resize({ width: 420, withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(output);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
