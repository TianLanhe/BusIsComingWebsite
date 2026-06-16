import { expect, test } from "@playwright/test";

test("carousel keeps the expected order and preserves state after locale switch", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
  await expect(page.getByLabel("Next slide")).toHaveCount(0);
  await expect(page.getByLabel("Previous slide")).toHaveCount(0);
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison", { timeout: 6_000 });

  await page.getByTestId("feature-showcase").hover();
  await page.waitForTimeout(5_000);
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");

  await page.getByTitle("English").click();
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");
  await expect(page.getByRole("heading", { name: "Compare total fare, time, and walking distance" })).toBeVisible();

  await page.screenshot({
    path: `../specs/003-homepage-ui-optimization/visual-review/${testInfo.project.name}-feature-carousel-v2.png`,
    fullPage: false,
  });
});
