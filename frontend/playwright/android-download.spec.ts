import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const expectedSha256 = "93e7930ee9e6b9cc05819bab895153ad985707bdcfff3e6bead60065acf07470";

test("Android download returns the current BusIsComing APK", async ({ page }, testInfo) => {
  await page.goto("/");

  const androidButton = page.locator("#hero").getByRole("button", { name: /Android/ });
  await androidButton.hover();
  await expect(page.locator("#hero").getByTestId("download-expanded")).toBeVisible();

  const screenshotName =
    testInfo.project.name === "mobile-390" ? "mobile-390-android-download.png" : "desktop-1440-android-download.png";
  await page.locator("#hero").screenshot({
    path: path.resolve("..", "specs", "002-android-apk-download", "visual-review", screenshotName),
  });

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#hero").getByTestId("download-expanded").click();
  const download = await downloadPromise;
  const downloadPath = path.join(testInfo.outputDir, "BusIsComing.apk");
  await download.saveAs(downloadPath);

  const file = await readFile(downloadPath);
  const sha256 = createHash("sha256").update(file).digest("hex");

  expect(download.suggestedFilename()).toBe("BusIsComing.apk");
  expect(file.byteLength).toBe(5_009_547);
  expect(sha256).toBe(expectedSha256);
});
