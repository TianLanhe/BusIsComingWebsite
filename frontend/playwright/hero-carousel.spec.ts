import { expect, test, type Page } from "@playwright/test";

async function clickExposedBackCard(page: Page, imageId: string) {
  await page.locator(`button[data-image-id="${imageId}"]`).click();
}

test("carousel keeps the expected order and separates screenshot and copy gestures", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
  await expect(page.getByTestId("feature-showcase")).toHaveAttribute("data-paused", "false");
  await expect(page.getByText("01")).toHaveCount(0);
  await expect(page.getByText(/点击放大|點擊放大|click to enlarge/i)).toHaveCount(0);
  await expect(page.getByTestId("screenshot-stack-thumbnails")).toHaveCount(0);
  await expect(page.getByTestId("screenshot-rail")).toHaveAttribute("data-visual-mode", "stair-card-deck");
  if (testInfo.project.name === "desktop-1440") {
    const mainBox = await page.getByTestId("screenshot-deck-main").boundingBox();
    expect(mainBox?.width ?? 0).toBeGreaterThan(250);
  }
  await clickExposedBackCard(page, "home-all-routes-sheet");
  await expect(page.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
  await page.getByRole("button", { name: "Feature Fare at a glance" }).click();
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");
  await expect(page.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-favorites-results");
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison", { timeout: 7_000 });

  await page.getByTestId("feature-showcase").hover();
  await page.waitForTimeout(3_600);
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");

  await page.getByTestId("feature-showcase").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "eta-details");

  const copyBox = await page.getByTestId("active-slide").boundingBox();
  expect(copyBox).not.toBeNull();
  await page.mouse.move(copyBox!.x + copyBox!.width * 0.9, copyBox!.y + copyBox!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(copyBox!.x + copyBox!.width * 0.1, copyBox!.y + copyBox!.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "predeparture-monitor");

  await page.getByRole("button", { name: "Feature Saved Citybus routes in one tap" }).click();
  await clickExposedBackCard(page, "home-favorites-results");
  await expect(page.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-favorites-results");
  const foldedImageBox = await page.locator('button[data-image-id="home-all-routes-sheet"]').boundingBox();
  expect(foldedImageBox).not.toBeNull();
  await page.mouse.move(foldedImageBox!.x + foldedImageBox!.width * 0.82, foldedImageBox!.y + foldedImageBox!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(foldedImageBox!.x + foldedImageBox!.width * 0.18, foldedImageBox!.y + foldedImageBox!.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
  await expect(page.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "home-all-routes-sheet");

  await page.getByTitle("English").click();
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");

  await page.screenshot({
    path: `../specs/007-homepage-ui-polish/visual-review/${testInfo.project.name}-feature-carousel.png`,
    fullPage: false,
  });
});
