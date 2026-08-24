import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const defaultReviewRoot = path.resolve(process.cwd(), "../specs/015-refine-homepage-interactions/visual-review");

function assertInsideReviewRoot(candidate, reviewRoot) {
  const resolved = path.resolve(candidate);
  if (resolved !== reviewRoot && !resolved.startsWith(`${reviewRoot}${path.sep}`)) {
    throw new Error(`Visual comparison paths must stay inside ${reviewRoot}`);
  }
  return resolved;
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

export async function compareImages({ referencePath, actualPath, basename, reviewRootPath = defaultReviewRoot }) {
  const reviewRoot = path.resolve(reviewRootPath);
  const reference = assertInsideReviewRoot(referencePath, reviewRoot);
  const actual = assertInsideReviewRoot(actualPath, reviewRoot);
  const sideBySidePath = assertInsideReviewRoot(path.join(reviewRoot, "side-by-side", `${basename}.png`), reviewRoot);
  const overlayPath = assertInsideReviewRoot(path.join(reviewRoot, "overlay", `${basename}.png`), reviewRoot);
  const diffPath = assertInsideReviewRoot(path.join(reviewRoot, "diff", `${basename}.png`), reviewRoot);
  await Promise.all(["side-by-side", "overlay", "diff", "comparisons"].map((directory) => mkdir(path.join(reviewRoot, directory), { recursive: true })));

  const referenceImage = sharp(reference).removeAlpha();
  const actualImage = sharp(actual).removeAlpha();
  const [referenceMeta, actualMeta] = await Promise.all([referenceImage.metadata(), actualImage.metadata()]);
  if (referenceMeta.width !== actualMeta.width || referenceMeta.height !== actualMeta.height) {
    throw new Error(`Image dimensions differ: ${referenceMeta.width}x${referenceMeta.height} vs ${actualMeta.width}x${actualMeta.height}`);
  }
  const width = referenceMeta.width;
  const height = referenceMeta.height;
  if (!width || !height) throw new Error("Images must have measurable dimensions");

  const [referenceBuffer, actualBuffer] = await Promise.all([referenceImage.png().toBuffer(), actualImage.png().toBuffer()]);
  await sharp({ create: { width: width * 2, height, channels: 3, background: "#ffffff" } })
    .composite([{ input: referenceBuffer, left: 0, top: 0 }, { input: actualBuffer, left: width, top: 0 }])
    .png()
    .toFile(sideBySidePath);
  await sharp(referenceBuffer)
    .composite([{ input: actualBuffer, blend: "over", opacity: 0.5 }])
    .png()
    .toFile(overlayPath);

  const referenceRaw = await sharp(referenceBuffer).raw().toBuffer();
  const actualRaw = await sharp(actualBuffer).raw().toBuffer();
  const diff = Buffer.alloc(referenceRaw.length);
  for (let index = 0; index < referenceRaw.length; index += 1) {
    diff[index] = Math.abs(referenceRaw[index] - actualRaw[index]);
  }
  await sharp(diff, { raw: { width, height, channels: 3 } }).png().toFile(diffPath);

  const result = {
    basename,
    width,
    height,
    referenceSha256: await sha256(reference),
    actualSha256: await sha256(actual),
    sideBySidePath: path.relative(reviewRoot, sideBySidePath),
    overlayPath: path.relative(reviewRoot, overlayPath),
    diffPath: path.relative(reviewRoot, diffPath),
  };
  const comparisonPath = assertInsideReviewRoot(path.join(reviewRoot, "comparisons", `${basename}.json`), reviewRoot);
  const indexPath = assertInsideReviewRoot(path.join(reviewRoot, "comparison-manifest.json"), reviewRoot);
  await writeFile(comparisonPath, `${JSON.stringify(result, null, 2)}\n`);

  let comparisons = [];
  try {
    const existing = JSON.parse(await readFile(indexPath, "utf8"));
    comparisons = Array.isArray(existing.comparisons)
      ? existing.comparisons
      : existing.basename
        ? [existing]
        : [];
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  comparisons = comparisons.filter((entry) => entry.basename !== basename).concat(result)
    .sort((left, right) => left.basename.localeCompare(right.basename));
  await writeFile(indexPath, `${JSON.stringify({ comparisons }, null, 2)}\n`);
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const [referencePath, actualPath, basename = "homepage"] = process.argv.slice(2);
  if (!referencePath || !actualPath) {
    console.error("Usage: npm run visual:compare -- <reference.png> <actual.png> [basename]");
    process.exitCode = 1;
  } else {
    compareImages({ referencePath, actualPath, basename })
      .then((result) => console.log(JSON.stringify(result, null, 2)))
      .catch((error) => { console.error(error); process.exitCode = 1; });
  }
}
