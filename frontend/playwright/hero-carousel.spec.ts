import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, waitForHomepageVisual } from "./helpers/homepageVisual";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/downloads/android/latest/metadata", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      platform: "android", status: "available", versionName: "1.3.1", versionCode: 19,
      fileName: "BusIsComing.apk", sizeBytes: 2_621_440, lastUpdated: "2026-08-24",
      downloadUrl: "/api/downloads/android/latest",
    }),
  }));
});

test("five resident phones keep final state through rapid explicit story controls", async ({ page }) => {
  await page.goto("/zh-hant/");
  const stage = page.getByTestId("hero-story-stage");
  await expect(stage.locator("figure")).toHaveCount(5);
  await expect(stage.locator('[data-story-id="route-search"]')).toHaveAttribute("data-slot", "front");
  await page.getByRole("button", { name: /02.*行程/ }).click();
  await expect(stage.locator('[data-story-id="saved-journeys"]')).toHaveAttribute("data-slot", "front");
  await expect(page.getByTestId("hero-title")).toContainText("常走的路");

  for (const story of ["05", "02", "04", "01", "05", "03", "01", "04", "02", "05", "01", "03", "04", "02", "01", "05", "04", "03", "02", "05"]) {
    await page.locator(`[role="group"] button[data-story-id]`).filter({ hasText: story }).click();
  }
  await expect(stage.locator('[data-story-id="predeparture-monitor"]')).toHaveAttribute("data-slot", "front");
  await waitForHomepageVisual(page);
  await expect(stage.locator("figure:not([data-slot='front']) img[alt='']")).toHaveCount(4);
  await expectNoHorizontalOverflow(page);
});

test("phone stage moves first and copy follows after the approved 160ms beat", async ({ page }) => {
  await page.goto("/zh-hant/");
  const stage = page.getByTestId("hero-story-stage");
  const title = page.getByTestId("hero-title");
  await expect(title).toContainText("隨心搜尋");

  await page.getByRole("button", { name: /02.*行程/ }).click();
  await expect(stage.locator('[data-story-id="saved-journeys"]')).toHaveAttribute("data-slot", "front");
  await expect(title).toContainText("隨心搜尋");
  await page.waitForTimeout(170);
  await expect(title).toContainText("常走的路");
  await expect(page.locator('[data-copy-phase="exiting"]')).toHaveCount(1);
});

test("reduced motion swaps stories without a transition timer", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  await page.getByRole("button", { name: /05.*Leave/ }).click();
  await expect(page.getByTestId("hero-story-stage")).toHaveAttribute("data-transition-state", "settled");
  await expect(page.getByTestId("hero-story-stage").locator('[data-story-id="predeparture-monitor"]')).toHaveAttribute("data-slot", "front");
});

test("story controls retain roving keyboard focus after a pointer selection", async ({ page }) => {
  await page.goto("/en/");
  const second = page.locator('[role="group"] button[data-story-id="saved-journeys"]');
  await second.click();
  await expect(second).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[role="group"] button[data-story-id="journey-guidance"]')).toBeFocused();
});
