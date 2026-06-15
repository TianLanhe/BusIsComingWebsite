import { expect, test } from "@playwright/test";
import path from "node:path";

test("iPhone state never triggers an APK download", async ({ page }, testInfo) => {
  await page.goto("/");

  await page.locator("#hero").getByRole("button", { name: /iPhone/ }).click();
  const maybeDownload = await page.waitForEvent("download", { timeout: 500 }).catch(() => null);

  expect(maybeDownload).toBeNull();
  await expect(page.locator("#hero").getByText(/iPhone 暫未支援|iPhone is not supported yet/)).toBeVisible();

  if (testInfo.project.name === "desktop-1440") {
    await page.locator("#hero").screenshot({
      path: path.resolve("..", "specs", "002-android-apk-download", "visual-review", "iphone-unsupported-state.png"),
    });
  }
});

test("download state survives language switching", async ({ page }, testInfo) => {
  await page.goto("/");

  await page.getByTitle("English").click();
  await expect(page.locator("#download").getByText("Android APK 1.0 · About 4.8 MB")).toBeVisible();

  await page.getByTitle("简体中文").click();
  await expect(page.locator("#download").getByText("Android APK 1.0 · 约 4.8 MB")).toBeVisible();

  await page.getByTitle("繁體中文").click();
  await expect(page.locator("#download").getByText("Android APK 1.0 · 約 4.8 MB")).toBeVisible();

  if (testInfo.project.name === "desktop-1440") {
    await page.locator("#download").scrollIntoViewIfNeeded();
    await page.locator("#download").screenshot({
      path: path.resolve("..", "specs", "002-android-apk-download", "visual-review", "desktop-1440-download-section.png"),
    });
  }
});

test("Android download failure shows a visible unavailable state within five seconds", async ({ page }) => {
  await page.route("**/api/downloads/android/latest", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ code: "APK_UNREADABLE", message: "Current Android APK cannot be read." }),
    });
  });

  await page.goto("/");
  await page.locator("#hero").getByRole("button", { name: /Android/ }).click();

  await expect(page.locator("#hero").getByRole("status")).toContainText(
    /下載資源暫不可用或校驗失敗|Download is unavailable or failed verification/,
    { timeout: 5_000 },
  );
});
