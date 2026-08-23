import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers/homepageVisual";

const ready = {
  platform: "android", status: "available", versionName: "1.3.1", versionCode: 19,
  fileName: "BusIsComing.apk", sizeBytes: 2_621_440, lastUpdated: "2026-08-24",
  downloadUrl: "/api/downloads/android/latest",
};

async function stub(page: Page, state: "checking" | "ready" | "unavailable") {
  await page.route("**/api/downloads/android/latest/metadata", async (route) => {
    if (state === "ready") return route.fulfill({ contentType: "application/json", body: JSON.stringify(ready) });
    if (state === "unavailable") return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ code: "APK_METADATA_INVALID" }) });
    return new Promise<void>(() => undefined);
  });
}

for (const state of ["checking", "ready", "unavailable"] as const) {
  test(`${state} keeps two stable actions and never fabricates progress`, async ({ page }) => {
    await stub(page, state);
    await page.goto("/en/");
    await expect(page.locator(`[data-download-state='android-${state}']`)).toHaveCount(2);
    if (state === "ready") {
      await expect(page.locator("#features [data-download-state='android-ready']")).toHaveAttribute("href", "/api/downloads/android/latest");
      await expect(page.locator("#download [data-download-state='android-ready']")).toHaveAttribute("download", "BusIsComing.apk");
      await expect(page.getByTestId("download-metadata-line")).toHaveCount(2);
    } else {
      await expect(page.locator("#features a[href*='/api/downloads/android/latest']")).toHaveCount(0);
      await expect(page.locator("#download svg")).toHaveCount(0);
    }
    await expect(page.getByText(/SHA|BUILD|install progress/i)).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });
}
