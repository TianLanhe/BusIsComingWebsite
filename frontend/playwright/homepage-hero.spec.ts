import { expect, test } from "@playwright/test";

test("desktop and mobile hero expose product positioning and download states", async ({ page }, testInfo) => {
  await page.goto("/");

  const hero = page.locator("#hero");
  const heroDownload = hero.getByTestId("download-segmented-button");

  await expect(hero.getByRole("heading", { name: /香港巴士查詢|Hong Kong bus lookup/ })).toBeVisible();
  await expect(hero.getByRole("link", { name: /下載 App|Download App/ })).toBeVisible();
  await expect(hero.getByRole("link", { name: /在線查詢|Online Query/ })).toBeVisible();
  await expect(heroDownload).toBeVisible();

  await hero.getByRole("button", { name: /Android/ }).focus();
  await expect(heroDownload).toHaveAttribute("data-state", "android-expanded");
  await expect(hero.getByText(/Android APK/)).toBeVisible();

  await page.goto("/");
  await page.locator("#hero").getByRole("button", { name: /iPhone/ }).focus();
  await expect(page.locator("#hero").getByTestId("download-segmented-button")).toHaveAttribute("data-state", "iphone-expanded");
  await expect(page.locator("#hero").getByText(/iPhone 暫未支援|iPhone is not supported yet/)).toBeVisible();

  await page.screenshot({
    path: `../specs/001-homepage-v1/visual-review/${testInfo.project.name}-hero.png`,
    fullPage: false,
  });
});
