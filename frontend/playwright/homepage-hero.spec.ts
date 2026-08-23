import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, waitForHomepageVisual } from "./helpers/homepageVisual";

const metadata = {
  platform: "android", status: "available", versionName: "1.3.1", versionCode: 19,
  fileName: "BusIsComing.apk", sizeBytes: 2_621_440, lastUpdated: "2026-08-24",
  downloadUrl: "/api/downloads/android/latest",
};

test("approved first screen keeps the title, CTAs, phone frame, and story rail in order", async ({ page }, testInfo) => {
  await page.route("**/api/downloads/android/latest/metadata", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(metadata) }));
  await page.goto("/zh-hant/");
  await waitForHomepageVisual(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("隨心搜尋，出發更輕鬆");
  await expect(page.locator("header nav").getByRole("link")).toHaveCount(3);
  await expect(page.locator("header").getByRole("button", { name: "選擇語言" })).toBeVisible();
  const primary = page.locator("#features").getByRole("link", { name: "下載 Android App" });
  const secondary = page.locator("#features").getByRole("link", { name: "路線試查 →" });
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();
  const primaryBox = await primary.boundingBox();
  const secondaryBox = await secondary.boundingBox();
  expect(primaryBox!.x).toBeLessThan(secondaryBox!.x);

  const stageBox = await page.getByTestId("hero-story-stage").boundingBox();
  const frontBox = await page.locator('[data-slot="front"]').boundingBox();
  const railBox = await page.getByRole("group", { name: /五個功能故事/ }).boundingBox();
  expect(frontBox).not.toBeNull();
  expect(railBox).not.toBeNull();
  if (testInfo.project.name.startsWith("mobile")) {
    expect(railBox!.y).toBeGreaterThanOrEqual(frontBox!.y + frontBox!.height);
    expect(stageBox!.y + stageBox!.height).toBeLessThanOrEqual(railBox!.y + 1);
  }
  await expectNoHorizontalOverflow(page);
});
