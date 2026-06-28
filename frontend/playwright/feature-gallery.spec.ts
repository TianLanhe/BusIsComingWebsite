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
  await expect(page.getByTestId("screenshot-lightbox")).toHaveAttribute("data-ui-mode", "minimal-image-overlay");
  await expect(page.getByTestId("lightbox-image")).toHaveAttribute("data-image-id", "home-all-routes-sheet");
  await expect(page.getByRole("button", { name: "Zoom in" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Zoom out" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reset zoom" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next screenshot in this feature" })).toHaveCount(0);
  await expect(page.getByTestId("lightbox-page-indicator")).toContainText("2 / 2");

  const viewport = page.getByTestId("lightbox-viewport");
  await viewport.hover();
  await page.mouse.wheel(0, -300);
  await expect(page.getByTestId("lightbox-image")).toHaveAttribute("data-zoom", "1.25");
  await page.mouse.wheel(0, 300);
  await expect(page.getByTestId("lightbox-image")).toHaveAttribute("data-zoom", "1");

  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  const swipeY = viewportBox!.y + viewportBox!.height * 0.5;
  await viewport.dispatchEvent("pointerdown", {
    bubbles: true,
    button: 0,
    clientX: viewportBox!.x + viewportBox!.width * 0.76,
    clientY: swipeY,
    pointerId: 31,
    pointerType: "touch",
  });
  await viewport.dispatchEvent("pointerup", {
    bubbles: true,
    button: 0,
    clientX: viewportBox!.x + viewportBox!.width * 0.24,
    clientY: swipeY,
    pointerId: 31,
    pointerType: "touch",
  });
  await expect(page.getByTestId("lightbox-image")).toHaveAttribute("data-image-id", "home-favorites-results");
  await expect(page.getByTestId("lightbox-page-indicator")).toContainText("1 / 2");

  await page.screenshot({
    path: `../specs/007-homepage-ui-polish/visual-review/${testInfo.project.name}-feature-rail-lightbox.png`,
    fullPage: false,
  });

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("screenshot-lightbox")).toHaveCount(0);
  await expect(rail).toHaveAttribute("data-active-image-id", "home-favorites-results");
});
