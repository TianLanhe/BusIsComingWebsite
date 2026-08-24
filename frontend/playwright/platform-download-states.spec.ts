import { expect, test } from "@playwright/test";

test("download metadata and action survive in-page language switching without another request", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/downloads/android/latest/metadata", (route) => {
    requests += 1;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        platform: "android", status: "available", versionName: "1.3.1", versionCode: 19,
        fileName: "BusIsComing.apk", sizeBytes: 2_621_440, lastUpdated: "2026-08-24",
        downloadUrl: "/api/downloads/android/latest",
      }),
    });
  });
  await page.goto("/zh-hant/#download");
  await expect(page.locator("#download").getByRole("link", { name: "下載 BusIsComing" })).toBeVisible();
  await page.getByRole("navigation", { name: "選擇語言" }).getByRole("link", { name: /EN/ }).click();
  await expect(page.locator("#download").getByRole("link", { name: "Download BusIsComing" })).toBeVisible();
  expect(requests).toBe(1);
});
