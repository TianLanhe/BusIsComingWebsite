import { expect, test } from "@playwright/test";

test("carousel keeps the expected order and preserves state after locale switch", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-routes");
  await page.getByLabel("Next slide").click();
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");

  await page.getByTitle("English").click();
  await expect(page.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");
  await expect(page.getByRole("heading", { name: "Compare fare, time, and walking distance" })).toBeVisible();

  await page.screenshot({
    path: `../specs/001-homepage-v1/visual-review/${testInfo.project.name}-carousel.png`,
    fullPage: false,
  });
});
