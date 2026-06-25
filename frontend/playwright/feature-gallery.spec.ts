import { expect, test } from "@playwright/test";

test("feature screenshot rail switches manually and does not auto-rotate inner gallery", async ({ page }, testInfo) => {
  await page.goto("/");

  const showcase = page.getByTestId("feature-showcase");
  const rail = page.getByTestId("screenshot-rail");
  await expect(rail).toHaveAttribute("data-active-image-id", "home-favorites-results");
  await expect(page.getByTestId("screenshot-deck-card")).toHaveCount(1);
  await expect(page.getByTestId("screenshot-stack-thumbnails")).toHaveCount(0);

  await showcase.locator('button[data-image-id="home-all-routes-sheet"]').click();
  await expect(rail).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");

  await page.waitForTimeout(5_000);
  await expect(rail).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");

  await page.screenshot({
    path: `../specs/003-homepage-ui-optimization/visual-review/${testInfo.project.name}-feature-rail-v2.png`,
    fullPage: false,
  });
});
