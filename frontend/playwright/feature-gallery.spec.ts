import { expect, test } from "@playwright/test";

test("feature screenshot rail switches manually and does not auto-rotate inner gallery", async ({ page }, testInfo) => {
  await page.goto("/");

  const showcase = page.getByTestId("feature-showcase");
  const rail = page.getByTestId("screenshot-rail");
  await expect(rail).toHaveAttribute("data-active-image-id", "home-favorites-results");
  await expect(page.getByTestId("screenshot-rail-preview")).toHaveCount(1);
  await expect(page.getByTestId("screenshot-stack-thumbnails")).toHaveCount(0);

  await showcase.dispatchEvent("pointerdown", { clientX: 240, pointerId: 1, pointerType: "touch" });
  await showcase.dispatchEvent("pointerup", { clientX: 120, pointerId: 1, pointerType: "touch" });
  await expect(rail).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");

  await page.waitForTimeout(5_000);
  await expect(rail).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");

  await page.screenshot({
    path: `../specs/003-homepage-ui-optimization/visual-review/${testInfo.project.name}-feature-rail-v2.png`,
    fullPage: false,
  });
});
