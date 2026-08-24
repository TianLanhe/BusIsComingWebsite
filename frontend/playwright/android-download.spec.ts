import { expect, test } from "@playwright/test";

test("ready metadata creates native links and one desktop-only QR target", async ({ page }, testInfo) => {
  const downloadUrl = "/api/downloads/android/latest";
  await page.route("**/api/downloads/android/latest/metadata", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      platform: "android", status: "available", versionName: "1.3.1", versionCode: 19,
      fileName: "BusIsComing.apk", sizeBytes: 2_621_440, lastUpdated: "2026-08-24", downloadUrl,
    }),
  }));
  await page.goto("/en/");
  await expect(page.locator("a[download='BusIsComing.apk']")).toHaveCount(testInfo.project.name === "desktop-1440" ? 1 : 2);
  await expect(page.locator("a[href^='blob:']")).toHaveCount(0);
  const qr = page.locator("#download [data-testid='download-qr-code']");
  if (testInfo.project.name === "desktop-1440") {
    await expect(page.locator("#features").getByRole("link", { name: "Download Android App" })).toHaveAttribute("href", "#download");
    await expect(qr).toBeVisible();
    await expect(qr).toHaveAttribute("data-qrcode-value", `http://127.0.0.1:5184${downloadUrl}`);
  } else {
    await expect(page.locator("#features").getByRole("link", { name: "Download App" })).toHaveAttribute("download", "BusIsComing.apk");
    await expect(qr).toHaveCount(0);
  }
});
