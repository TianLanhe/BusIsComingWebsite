import { expect, test } from "@playwright/test";

const readyMetadata = {
  platform: "android",
  status: "available",
  versionName: "1.0",
  versionCode: 1,
  fileName: "BusIsComing.apk",
  sizeBytes: 5_563_930,
  lastUpdated: "2026-07-07",
  downloadUrl: "/api/downloads/android/latest",
};

test("renders metadata and keeps download reachable when metadata later fails", async ({ page }, testInfo) => {
  let available = true;
  let requestCount = 0;
  await page.route("**/api/downloads/android/latest/metadata", async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: available ? 200 : 500,
      contentType: "application/json",
      body: JSON.stringify(available ? readyMetadata : { code: "APK_METADATA_INVALID", message: "暂时不可用" }),
    });
  });

  await page.goto("/zh-hans/");
  await expect(page.getByText("Android APK 1.0 · 5.3 MB").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "下载 Android APK" })).toHaveAttribute("href", "/api/downloads/android/latest");
  expect(requestCount).toBe(1);
  const screenshot = testInfo.project.name.includes("desktop")
    ? "playwright/__screenshots__/apk-metadata-desktop.png"
    : "playwright/__screenshots__/apk-metadata-mobile.png";
  await page.screenshot({ path: screenshot, fullPage: false });

  available = false;
  await page.reload();
  await expect(page.getByText(/版本和大小暂时不可用/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "下载 Android APK" })).toHaveAttribute("href", "/api/downloads/android/latest");
  await expect(page.getByRole("button", { name: /重新加载|重试版本/ })).toHaveCount(0);
  expect(requestCount).toBe(2);
});
