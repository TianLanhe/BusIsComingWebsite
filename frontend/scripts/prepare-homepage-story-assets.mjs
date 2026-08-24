import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const APPROVED_AT = "2026-08-25";
const OUTPUT_WIDTHS = [540, 720, 1080];

const ASSET_CONTRACTS = [
  asset("route-search", "01-search-freely.png", "b3234b875dcb682e042cab173b831b23e9aa66f0b434f6d67d59e9d37146d8ce", "01-search-freely-en.png", "7c68e28ee80060e22fd8cf05a14c40cb750e85593b6156277a103467126e11c2", {
    "zh-Hant": "本次行程及候選巴士路線", "zh-Hans": "本次行程及候选巴士路线", en: "Current journey and suggested bus routes",
  }),
  asset("saved-journeys", "02-saved-journey.png", "c2a1555fb593e64712cb6173c88097d562b9935e625227fa144f3e9227a2c0a6", "02-saved-journey-en.png", "25d47c68b61afdd9a1738f082899493f7e9599c369a92dff72f1f0de967e2fb2", {
    "zh-Hant": "常用行程及巴士路線比較", "zh-Hans": "常用行程及巴士路线比较", en: "Saved journeys and bus route comparison",
  }),
  asset("journey-guidance", "03-route-detail.png", "cba019119377be69dcf75f99a1f21aa0002dad7bc60a896d049b6e2bef64df58", "03-route-detail-en.png", "5d3aea154a443dfa09267409939a14e074a03a80c7fdd654e9687b412b651a95", {
    "zh-Hant": "路線、轉乘與目前位置畫面", "zh-Hans": "路线、换乘与当前位置画面", en: "Route, transfers, and current position view",
  }),
  asset("cross-operator-arrivals", "04-cross-operator-arrivals.png", "b479882ff58f2ffd573968d79f34553a8a8d852ba5d1e40576f929b7d8c63e87", "04-cross-operator-arrivals-en.png", "42d211fb8c27a5193ba0871e74c5185ad2fbc6cd07cc5655b33540a08655c001", {
    "zh-Hant": "跨營運商巴士到站時間", "zh-Hans": "跨运营商巴士到站时间", en: "Bus arrivals across operators for an eligible route",
  }),
  asset("predeparture-monitor", "05-monitor-reminder.png", "f9099ff1543636689efd5e15b59d17149cb8f547956b47287525370c5ac52dac", "05-monitor-reminder-en.png", "c035484e1deb8556e9d36dd53fa1f63d50f51c4617a56f1c9049d6451a0cd100", {
    "zh-Hant": "鎖屏上的候車與步行監控", "zh-Hans": "锁屏上的候车与步行监控", en: "Waiting and walking updates on the lock screen",
  }),
];

function asset(id, zhFile, zhSha256, enFile, enSha256, alt) {
  return { id, files: { zh: zhFile, en: enFile }, sha256: { zh: zhSha256, en: enSha256 }, alt };
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function validationError(id, variant, reason) {
  return new Error(`Homepage screenshot source validation failed (${id}/${variant}: ${reason})`);
}

async function readApprovedSource(sourceDirectory, contract, variant) {
  let buffer;
  try {
    buffer = await readFile(path.join(sourceDirectory, contract.files[variant]));
  } catch {
    throw validationError(contract.id, variant, "missing or unreadable file");
  }
  if (sha256(buffer) !== contract.sha256[variant]) {
    throw validationError(contract.id, variant, "approved SHA mismatch");
  }

  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw validationError(contract.id, variant, "invalid image");
  }
  if (metadata.width !== 1080 || metadata.height !== 1920) {
    throw validationError(contract.id, variant, "expected 1080x1920");
  }
  return buffer;
}

async function buildVariant({ contract, variant, sourceBuffer, stagingDirectory, outputDirectory, repositoryDirectory }) {
  const outputs = [];
  for (const width of OUTPUT_WIDTHS) {
    const height = Math.round(width * 16 / 9);
    const outputName = `${contract.id}-${variant}-${width}.webp`;
    const outputBuffer = await sharp(sourceBuffer)
      .resize({ width, height, fit: "fill" })
      .webp({ quality: 92, smartSubsample: true })
      .toBuffer();
    await writeFile(path.join(stagingDirectory, outputName), outputBuffer);
    outputs.push({
      assetPath: path.relative(repositoryDirectory, path.join(outputDirectory, outputName)),
      width,
      height,
      format: "webp",
      sizeBytes: outputBuffer.length,
      sha256: sha256(outputBuffer),
    });
  }
  return {
    sourceFileName: contract.files[variant],
    sourceFingerprint: { width: 1080, height: 1920, sha256: contract.sha256[variant] },
    outputs,
    approvalStatus: "approved",
    desensitizationStatus: "approved",
    redactedItems: [],
    retainedItems: ["approved-product-ui", "route-and-arrival-values", "app-navigation"],
    approvedAt: APPROVED_AT,
  };
}

async function replaceDirectoryAtomically(stagingDirectory, outputDirectory) {
  const backupDirectory = `${outputDirectory}.backup-${randomUUID()}`;
  let movedCurrent = false;
  try {
    try {
      await rename(outputDirectory, backupDirectory);
      movedCurrent = true;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    await rename(stagingDirectory, outputDirectory);
    if (movedCurrent) await rm(backupDirectory, { recursive: true, force: true });
  } catch {
    if (movedCurrent) {
      await rm(outputDirectory, { recursive: true, force: true });
      await rename(backupDirectory, outputDirectory);
    }
    throw new Error("Homepage screenshot atomic replacement failed");
  }
}

export async function prepareHomepageStoryAssets({
  zhSourceDirectory,
  enSourceDirectory,
  outputDirectory = path.resolve(import.meta.dirname, "../src/assets/app-screenshots/real"),
  repositoryDirectory = path.resolve(import.meta.dirname, "../.."),
}) {
  if (!zhSourceDirectory || !enSourceDirectory) {
    throw new Error("Homepage screenshot source validation failed (both localized sources are required)");
  }

  const sourceBuffers = new Map();
  for (const contract of ASSET_CONTRACTS) {
    sourceBuffers.set(`${contract.id}:zh`, await readApprovedSource(zhSourceDirectory, contract, "zh"));
    sourceBuffers.set(`${contract.id}:en`, await readApprovedSource(enSourceDirectory, contract, "en"));
  }

  const outputParent = path.dirname(outputDirectory);
  await mkdir(outputParent, { recursive: true });
  const stagingDirectory = await mkdtemp(path.join(outputParent, ".homepage-assets-staging-"));
  try {
    const assets = [];
    for (const [index, contract] of ASSET_CONTRACTS.entries()) {
      const variants = {};
      for (const variant of ["zh", "en"]) {
        variants[variant] = await buildVariant({
          contract,
          variant,
          sourceBuffer: sourceBuffers.get(`${contract.id}:${variant}`),
          stagingDirectory,
          outputDirectory,
          repositoryDirectory,
        });
      }
      assets.push({
        id: contract.id,
        storyId: contract.id,
        order: index + 1,
        variants,
        alt: contract.alt,
        provenanceLabel: "User-provided v1.3.1 localized core-value screenshots approved for Figma refinement 136:292",
      });
    }

    const manifest = {
      schemaVersion: "3.0.0",
      appVersion: "1.3.1",
      approvedAt: APPROVED_AT,
      localeVariantByLocale: { "zh-Hant": "zh", "zh-Hans": "zh", en: "en" },
      assets,
    };
    await writeFile(path.join(stagingDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    await replaceDirectoryAtomically(stagingDirectory, outputDirectory);
    return manifest;
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true });
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  prepareHomepageStoryAssets({
    zhSourceDirectory: process.env.BIC_FIGMA_ZH_SCREENSHOT_DIR,
    enSourceDirectory: process.env.BIC_FIGMA_EN_SCREENSHOT_DIR,
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : "Homepage screenshot preparation failed");
    process.exitCode = 1;
  });
}
