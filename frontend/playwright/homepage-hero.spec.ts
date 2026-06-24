import { expect, test } from "@playwright/test";

test("desktop and mobile hero expose product positioning and download states", async ({ page }, testInfo) => {
  await page.goto("/");

  const hero = page.locator("#hero");

  await expect(hero.getByRole("heading", { name: /城巴查詢|Citybus lookup/ })).toBeVisible();
  await expect(hero.getByRole("link", { name: /下載 Android APK|Download Android APK/ })).toBeVisible();
  await expect(hero.getByRole("link", { name: /網上試查|Online Query/ })).toBeVisible();
  await expect(hero.getByText(/Android APK 1.0/)).toBeVisible();
  await expect(hero.getByText(/iPhone 暫未支援|iPhone is not supported yet/)).toBeVisible();
  await expect(hero.getByTestId("download-segmented-button")).toHaveCount(0);
  await expect(page.locator("header img").first()).toHaveAttribute("src", /busiscoming-logo-foreground/);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/favicon.webp");

  await page.screenshot({
    path: `../specs/005-homepage-experience-polish/visual-review/${testInfo.project.name}-hero.png`,
    fullPage: false,
  });
});
