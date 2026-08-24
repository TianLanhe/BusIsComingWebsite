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
  await expect(page.locator("#root > header")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "選擇語言" }).getByRole("link")).toHaveCount(3);
  await expect(page.locator("#features").getByRole("img", { name: "BusIsComing" })).toBeVisible();
  const primary = page.locator("#features").getByRole("link", { name: "下載 Android App" });
  const secondary = page.locator("#features").getByRole("link", { name: "路線試查 →" });
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();
  const primaryBox = await primary.boundingBox();
  const secondaryBox = await secondary.boundingBox();
  expect(primaryBox!.x).toBeLessThan(secondaryBox!.x);
  await expect(primary).toHaveAttribute("href", testInfo.project.name === "desktop-1440" ? "#download" : "/api/downloads/android/latest");

  const stageBox = await page.getByTestId("hero-story-stage").boundingBox();
  const frontBox = await page.locator('[data-slot="front"]').boundingBox();
  const railBox = await page.getByRole("group", { name: /五個功能故事/ }).boundingBox();
  expect(frontBox).not.toBeNull();
  expect(railBox).not.toBeNull();
  if (testInfo.project.name.startsWith("mobile")) {
    expect(railBox!.y).toBeGreaterThanOrEqual(frontBox!.y + frontBox!.height);
    expect(stageBox!.y + stageBox!.height).toBeLessThanOrEqual(railBox!.y + 1);
  }
  await expect(page.getByText("2026-08-24")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
