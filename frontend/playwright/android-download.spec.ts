import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

async function expectNativeDownload(
  page: Page,
  entry: Locator,
  testInfo: TestInfo,
  name: string,
  manifest: { sizeBytes: number; sha256: string },
) {
  await expect(entry).toHaveAttribute("href", "/api/downloads/android/latest");
  await expect(entry).toHaveAttribute("download", "BusIsComing.apk");

  const downloadPromise = page.waitForEvent("download");
  await entry.click();
  const download = await downloadPromise;
  const downloadPath = path.join(testInfo.outputDir, `${name}-BusIsComing.apk`);
  await download.saveAs(downloadPath);

  const file = await readFile(downloadPath);
  expect(download.suggestedFilename()).toBe("BusIsComing.apk");
  expect(file.byteLength).toBe(manifest.sizeBytes);
  expect(createHash("sha256").update(file).digest("hex")).toBe(manifest.sha256);
}

test("both Android entry points hand the current APK to the browser download manager", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const nativeFetch = window.fetch;
    let apkFetches = 0;
    window.fetch = (...args) => {
      if (args[0] === "/api/downloads/android/latest") {
        apkFetches += 1;
      }
      return nativeFetch(...args);
    };
    Object.defineProperty(window, "__apkFetches", { get: () => apkFetches });
  });
  await page.goto("/en/");

  const manifest = JSON.parse(await readFile(path.resolve("..", "backend", "downloads", "android", "current.json"), "utf8")) as {
    sizeBytes: number;
    sha256: string;
  };
  await expectNativeDownload(
    page,
    page.locator("#hero").getByRole("link", { name: "Download Android APK" }),
    testInfo,
    "hero",
    manifest,
  );
  await expectNativeDownload(
    page,
    page.locator("#download").getByRole("link", { name: "Download Android APK" }),
    testInfo,
    "download-section",
    manifest,
  );
  await expect(page.locator("a[href^='blob:']")).toHaveCount(0);
  expect(await page.evaluate(() => (window as Window & { __apkFetches: number }).__apkFetches)).toBe(0);
});
