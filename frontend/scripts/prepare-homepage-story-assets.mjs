import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const APPROVED_AT = "2026-08-25";
const OUTPUT_WIDTHS = [540, 720, 1080];
const OUTPUT_ASPECT_RATIO = 1080 / 2172;

const ASSET_CONTRACTS = [
  asset("route-search", "01-search-freely-raw.png", "d9621d2a93b348d01eb83ce4917bc5d0b249e5d24d9ce7450aa57384a0c74989", 2172, "01-search-freely-raw.png", "c61507546663f144a161146929f77bd06dd0c19d5c892ae57568fea3f07dcf9f", 2172, {
    "zh-Hant": "本次行程及候選巴士路線", "zh-Hans": "本次行程及候选巴士路线", en: "Current journey and suggested bus routes",
  }),
  asset("saved-journeys", "02-saved-journey-raw.png", "f5ff363cc192ebca12b8426f9aebab3fad20565381365ba941e21529503c3eb9", 2172, "02-saved-journey-raw.png", "c145f5aaaa67365b879c1502209731990ed018668b5bdcfdaf27e7faf433ccae", 2172, {
    "zh-Hant": "常用行程及巴士路線比較", "zh-Hans": "常用行程及巴士路线比较", en: "Saved journeys and bus route comparison",
  }),
  asset("journey-guidance", "03-route-detail-raw.png", "10db41131df140927ed347d7a83c26f83e23ee5344c6873c411b2062571bebfd", 2172, "03-route-detail-raw.png", "c44f2233f5ae90b9c662e339a28873323752be0ba1f72b8e392b04aee35ecc6f", 2172, {
    "zh-Hant": "路線、轉乘與目前位置畫面", "zh-Hans": "路线、换乘与当前位置画面", en: "Route, transfers, and current position view",
  }),
  asset("cross-operator-arrivals", "04-cross-operator-arrivals-raw.png", "9af05fc114796d05e887b8b3dd1e2b127393efb9a7c2b23cd7e1476dc2ece4a1", 2172, "04-cross-operator-arrivals-raw.png", "d0690de1a81b8f23b1e4c5be9eb80e2a0451b430247d336fa399cf575a2b1dbe", 2172, {
    "zh-Hant": "跨營運商巴士到站時間", "zh-Hans": "跨运营商巴士到站时间", en: "Bus arrivals across operators for an eligible route",
  }),
  asset("predeparture-monitor", "05-lockscreen-expanded-raw.png", "1cda8c7ff30823be5b95498dfd640bf124f4e3886851cd5ab6ad7968c4afa1bd", 2400, "05-monitor-lockscreen-raw.png", "7c1f8d1bcce3934e3594cdf609b98673f2509ec060c2aecf5b7d51037e099162", 2400, {
    "zh-Hant": "鎖屏上的候車與步行監控", "zh-Hans": "锁屏上的候车与步行监控", en: "Waiting and walking updates on the lock screen",
  }),
];

function asset(id, zhFile, zhSha256, zhHeight, enFile, enSha256, enHeight, alt) {
  return {
    id,
    files: { zh: zhFile, en: enFile },
    sha256: { zh: zhSha256, en: enSha256 },
    dimensions: { zh: { width: 1080, height: zhHeight }, en: { width: 1080, height: enHeight } },
    alt,
  };
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
  const expected = contract.dimensions[variant];
  if (metadata.width !== expected.width || metadata.height !== expected.height) {
    throw validationError(contract.id, variant, `expected ${expected.width}x${expected.height}`);
  }
  return buffer;
}

async function buildVariant({ contract, variant, sourceBuffer, stagingDirectory, outputDirectory, repositoryDirectory }) {
  const outputs = [];
  for (const width of OUTPUT_WIDTHS) {
    const height = Math.round(width / OUTPUT_ASPECT_RATIO);
    const outputName = `${contract.id}-${variant}-${width}.webp`;
    const outputBuffer = await sharp(sourceBuffer)
      .resize({ width, height, fit: "cover", position: "top" })
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
    sourceFingerprint: { ...contract.dimensions[variant], sha256: contract.sha256[variant] },
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
        provenanceLabel: "User-provided v1.3.1 localized raw core-value screenshots; top-aligned 1080:2172 derivatives approved for homepage use",
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
