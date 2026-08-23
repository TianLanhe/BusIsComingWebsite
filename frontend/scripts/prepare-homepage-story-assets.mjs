import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const sourceDirectory = process.env.HOMEPAGE_STORY_SOURCE_DIR;
if (!sourceDirectory) {
  throw new Error("HOMEPAGE_STORY_SOURCE_DIR is required");
}

const frontendDirectory = path.resolve(import.meta.dirname, "..");
const repositoryDirectory = path.resolve(frontendDirectory, "..");
const outputDirectory = path.join(frontendDirectory, "src/assets/app-screenshots/real");

const assets = [
  {
    id: "route-search",
    file: "01-search-freely-raw.png",
    sha256: "d9621d2a93b348d01eb83ce4917bc5d0b249e5d24d9ce7450aa57384a0c74989",
    alt: { "zh-Hant": "本次行程及候選巴士路線", "zh-Hans": "本次行程及候选巴士路线", en: "Current journey and suggested bus routes" },
  },
  {
    id: "saved-journeys",
    file: "02-saved-journey-raw.png",
    sha256: "f5ff363cc192ebca12b8426f9aebab3fad20565381365ba941e21529503c3eb9",
    alt: { "zh-Hant": "常用行程及巴士路線比較", "zh-Hans": "常用行程及巴士路线比较", en: "Saved journeys and bus route comparison" },
  },
  {
    id: "journey-guidance",
    file: "03-route-detail-raw.png",
    sha256: "10db41131df140927ed347d7a83c26f83e23ee5344c6873c411b2062571bebfd",
    alt: { "zh-Hant": "路線、轉乘與目前位置畫面", "zh-Hans": "路线、换乘与当前位置画面", en: "Route, transfers, and current position view" },
  },
  {
    id: "cross-operator-arrivals",
    file: "04-cross-operator-arrivals-raw.png",
    sha256: "9af05fc114796d05e887b8b3dd1e2b127393efb9a7c2b23cd7e1476dc2ece4a1",
    alt: { "zh-Hant": "跨營運商巴士到站時間", "zh-Hans": "跨运营商巴士到站时间", en: "Bus arrivals across operators for an eligible route" },
  },
  {
    id: "predeparture-monitor",
    file: "05-lockscreen-expanded-raw.png",
    sha256: "1cda8c7ff30823be5b95498dfd640bf124f4e3886851cd5ab6ad7968c4afa1bd",
    alt: { "zh-Hant": "鎖屏上的候車與步行監控", "zh-Hans": "锁屏上的候车与步行监控", en: "Waiting and walking updates on the lock screen" },
  },
];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

await mkdir(outputDirectory, { recursive: true });
const manifestAssets = [];

for (const [index, asset] of assets.entries()) {
  const sourceFile = path.join(sourceDirectory, asset.file);
  const sourceBuffer = await readFile(sourceFile);
  const sourceSha = sha256(sourceBuffer);
  if (sourceSha !== asset.sha256) {
    throw new Error(`Approved SHA mismatch for ${asset.id}`);
  }
  const metadata = await sharp(sourceBuffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Missing dimensions for ${asset.id}`);
  }

  const outputs = [];
  for (const width of [540, 720, 1080]) {
    const outputName = `${asset.id}-${width}.webp`;
    const outputFile = path.join(outputDirectory, outputName);
    const outputBuffer = await sharp(sourceBuffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 92, smartSubsample: true })
      .toBuffer();
    await writeFile(outputFile, outputBuffer);
    const outputMetadata = await sharp(outputBuffer).metadata();
    const outputStats = await stat(outputFile);
    outputs.push({
      assetPath: path.relative(repositoryDirectory, outputFile),
      width: outputMetadata.width,
      height: outputMetadata.height,
      format: "webp",
      sizeBytes: outputStats.size,
      sha256: sha256(outputBuffer),
    });
  }

  manifestAssets.push({
    id: asset.id,
    storyId: asset.id,
    order: index + 1,
    sourceFingerprint: { width: metadata.width, height: metadata.height, sha256: sourceSha },
    outputs,
    approvalStatus: "approved",
    desensitizationStatus: "approved",
    redactedItems: [],
    retainedItems: ["approved-product-ui", "route-and-arrival-values", "app-navigation"],
    alt: asset.alt,
    approvedAt: "2026-08-21",
    provenanceLabel: "User-provided v1.3.1 core-value screenshot approved in Figma 119:64",
  });
}

await writeFile(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify({ schemaVersion: "2.0.0", appVersion: "1.3.1", approvedAt: "2026-08-21", assets: manifestAssets }, null, 2)}\n`,
);
