import { expect, test } from "@playwright/test";

test("carousel keeps the expected order and preserves state after locale switch", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
  await expect(page.getByTestId("feature-showcase")).toHaveAttribute("data-paused", "false");
  await expect(page.getByText("01")).toHaveCount(0);
  await expect(page.getByTestId("screenshot-stack-thumbnails")).toHaveCount(0);
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison", { timeout: 7_000 });

  await page.getByTestId("feature-showcase").hover();
  await page.waitForTimeout(3_600);
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");

  await page.getByTestId("feature-showcase").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "eta-details");

  const box = await page.getByTestId("feature-showcase").boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * 0.72, box!.y + box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.28, box!.y + box!.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", /eta-details|predeparture-monitor/);

  await page.getByTitle("English").click();
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", /eta-details|predeparture-monitor/);

  await page.screenshot({
    path: `../specs/005-homepage-experience-polish/visual-review/${testInfo.project.name}-feature-carousel.png`,
    fullPage: false,
  });
});
