import { expect, test } from "@playwright/test";

test("feature screenshot stack switches manually and does not auto-rotate inner gallery", async ({ page }, testInfo) => {
  await page.goto("/");

  const stack = page.getByTestId("screenshot-stack");
  await expect(stack).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-1");

  await page.getByRole("button", { name: /Show saved Citybus route setup 2/ }).click();
  await expect(stack).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-2");

  await page.waitForTimeout(5_000);
  await expect(stack).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-2");

  await page.screenshot({
    path: `../specs/003-homepage-ui-optimization/visual-review/${testInfo.project.name}-feature-stack-v2.png`,
    fullPage: false,
  });
});
