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

  await page.getByTestId("screenshot-deck-main").click();
  await expect(page.getByTestId("screenshot-lightbox")).toBeVisible();
  await expect(page.getByTestId("lightbox-image")).toHaveAttribute("data-image-id", "home-all-routes-sheet");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByTestId("lightbox-image")).toHaveAttribute("data-zoom", "1.25");
  await page.getByRole("button", { name: "Next screenshot in this feature" }).click();
  await expect(page.getByTestId("lightbox-image")).toHaveAttribute("data-image-id", "home-favorites-results");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("screenshot-lightbox")).toHaveCount(0);
  await expect(rail).toHaveAttribute("data-active-image-id", "home-favorites-results");

  await page.screenshot({
    path: `../specs/007-homepage-ui-polish/visual-review/${testInfo.project.name}-feature-rail-lightbox.png`,
    fullPage: false,
  });
});
