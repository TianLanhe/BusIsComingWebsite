import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const expectedSha256 = "93e7930ee9e6b9cc05819bab895153ad985707bdcfff3e6bead60065acf07470";

test("Android download returns the current BusIsComing APK", async ({ page }, testInfo) => {
  await page.goto("/");

  const beforeScrollY = await page.evaluate(() => window.scrollY);
  const androidLink = page.locator("#hero").getByRole("link", { name: /Download Android APK|下載 Android APK|下载 Android APK/ });
  await expect(androidLink).toHaveAttribute("href", /\/api\/downloads\/android\/latest$/);

  const screenshotName =
    testInfo.project.name === "mobile-390" ? "mobile-390-hero-v2.png" : "desktop-1440-hero-v2.png";
  await page.locator("#hero").screenshot({
    path: path.resolve("..", "specs", "003-homepage-ui-optimization", "visual-review", screenshotName),
  });

  const downloadPromise = page.waitForEvent("download");
  await androidLink.click();
  const download = await downloadPromise;
  const afterScrollY = await page.evaluate(() => window.scrollY);
  const downloadPath = path.join(testInfo.outputDir, "BusIsComing.apk");
  await download.saveAs(downloadPath);

  const file = await readFile(downloadPath);
  const sha256 = createHash("sha256").update(file).digest("hex");

  expect(download.suggestedFilename()).toBe("BusIsComing.apk");
  expect(afterScrollY).toBe(beforeScrollY);
  expect(file.byteLength).toBe(5_009_547);
  expect(sha256).toBe(expectedSha256);
});
