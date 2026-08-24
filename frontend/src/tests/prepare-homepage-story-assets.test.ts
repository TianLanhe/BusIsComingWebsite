import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { prepareHomepageStoryAssets } from "../../scripts/prepare-homepage-story-assets.mjs";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("localized homepage screenshot preparation", () => {
  it("leaves the managed directory untouched when source validation fails", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bic-assets-test-"));
    temporaryRoots.push(root);
    const zhSourceDirectory = path.join(root, "private-zh-source");
    const enSourceDirectory = path.join(root, "private-en-source");
    const outputDirectory = path.join(root, "managed");
    await Promise.all([
      import("node:fs/promises").then(({ mkdir }) => mkdir(zhSourceDirectory, { recursive: true })),
      import("node:fs/promises").then(({ mkdir }) => mkdir(enSourceDirectory, { recursive: true })),
      import("node:fs/promises").then(({ mkdir }) => mkdir(outputDirectory, { recursive: true })),
    ]);
    const sentinel = path.join(outputDirectory, "sentinel.txt");
    await writeFile(sentinel, "keep-current-assets");

    await expect(prepareHomepageStoryAssets({ zhSourceDirectory, enSourceDirectory, outputDirectory }))
      .rejects.toThrow(/source validation failed/i);
    expect(await readFile(sentinel, "utf8")).toBe("keep-current-assets");
  });

  it("does not disclose either source directory in validation errors", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "bic-assets-private-"));
    temporaryRoots.push(root);
    const zhSourceDirectory = path.join(root, "secret-zh");
    const enSourceDirectory = path.join(root, "secret-en");

    try {
      await prepareHomepageStoryAssets({ zhSourceDirectory, enSourceDirectory, outputDirectory: path.join(root, "managed") });
      throw new Error("expected preparation to fail");
    } catch (error) {
      const message = String(error);
      expect(message).not.toContain(zhSourceDirectory);
      expect(message).not.toContain(enSourceDirectory);
    }
  });
});
