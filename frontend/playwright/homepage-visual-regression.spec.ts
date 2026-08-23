import { expect, test } from "@playwright/test";
import { waitForHomepageVisual } from "./helpers/homepageVisual";

const metadata = {
  platform: "android", status: "available", versionName: "1.3.1", versionCode: 19,
  fileName: "BusIsComing.apk", sizeBytes: 2_621_440, lastUpdated: "2026-08-24",
  downloadUrl: "/api/downloads/android/latest",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/downloads/android/latest/metadata", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(metadata) }));
  await page.goto("/zh-hant/");
});

test("approved five-story first screen stays pixel-stable", async ({ page }) => {
  test.setTimeout(75_000);
  const locales = [
    { path: "zh-hant", screenshotPrefix: "" },
    { path: "zh-hans", screenshotPrefix: "zh-hans-" },
    { path: "en", screenshotPrefix: "en-" },
  ];
  for (const locale of locales) {
    if (locale.path !== "zh-hant") await page.goto(`/${locale.path}/`);
    for (const [index, storyId] of ["route-search", "saved-journeys", "journey-guidance", "cross-operator-arrivals", "predeparture-monitor"].entries()) {
      if (index > 0) await page.locator(`[role="group"] button[data-story-id="${storyId}"]`).click();
      await waitForHomepageVisual(page);
      await expect(page).toHaveScreenshot(`${locale.screenshotPrefix}first-screen-story-${String(index + 1).padStart(2, "0")}.png`, { fullPage: false });
    }
  }
});

test("Route, Download, and Support sections stay pixel-stable", async ({ page }) => {
  await page.locator("#route-trial").scrollIntoViewIfNeeded();
  await expect(page.locator("#route-trial")).toHaveScreenshot("route-idle.png");
  await page.locator("#download").scrollIntoViewIfNeeded();
  await expect(page.locator("#download")).toHaveAttribute("data-converged", "true");
  await expect(page.locator("#download")).toHaveScreenshot("download-ready.png");
  await page.locator("#faq").scrollIntoViewIfNeeded();
  await expect(page.locator("#faq")).toHaveScreenshot("faq-default.png");
});
