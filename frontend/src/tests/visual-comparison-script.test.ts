import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { compareImages } from "../../scripts/compare-homepage-visuals.mjs";

const root = path.resolve("../specs/014-upgrade-homepage-visual-system/visual-review");
const fixtureRoot = path.join(root, "test-fixtures");

afterAll(() => rm(fixtureRoot, { recursive: true, force: true }));

describe("homepage visual comparison", () => {
  it("produces side-by-side, overlay, diff, and SHA evidence", async () => {
    await mkdir(fixtureRoot, { recursive: true });
    const referencePath = path.join(fixtureRoot, "reference.png");
    const actualPath = path.join(fixtureRoot, "actual.png");
    await sharp({ create: { width: 8, height: 6, channels: 3, background: "#eff7f3" } }).png().toFile(referencePath);
    await sharp({ create: { width: 8, height: 6, channels: 3, background: "#0b6f67" } }).png().toFile(actualPath);
    const result = await compareImages({ referencePath, actualPath, basename: "unit-contract", reviewRootPath: fixtureRoot });
    expect(result).toMatchObject({ width: 8, height: 6 });
    expect(result.referenceSha256).toHaveLength(64);
    expect(result.actualSha256).toHaveLength(64);
    expect(result.sideBySidePath).toBe("side-by-side/unit-contract.png");
  });
});
