import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers/homepageVisual";

async function expectFrontPhoneInsideViewport(page: import("@playwright/test").Page) {
  const hero = page.locator("#features");
  const frontPhone = page.getByTestId("hero-story-stage").locator('[data-slot="front"]');
  const [heroBox, box] = await Promise.all([hero.boundingBox(), frontPhone.boundingBox()]);
  expect(heroBox).not.toBeNull();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(heroBox!.x);
  expect(box!.x + box!.width).toBeLessThanOrEqual(heroBox!.x + heroBox!.width);
  expect(box!.y).toBeGreaterThanOrEqual(heroBox!.y);
  expect(box!.y + box!.height).toBeLessThanOrEqual(heroBox!.y + heroBox!.height);
}

for (const locale of ["zh-hant", "zh-hans", "en"] as const) {
  test(`${locale} preserves active story and FAQ state through in-page language switching`, async ({ page }) => {
    await page.goto(`/${locale}/#faq`);
    await page.locator('[role="group"] button[data-story-id="journey-guidance"]').click();
    const faq = page.locator("#faq");
    await faq.getByRole("button", { name: /網站試查|网站试查|website trial/i }).click();
    await page.getByRole("navigation", { name: /選擇語言|选择语言|Choose language/ }).getByRole("link", { name: /EN/ }).click();
    await expect(page.getByTestId("hero-story-stage").locator('[data-story-id="journey-guidance"]')).toHaveAttribute("data-slot", "front");
    await expect(faq.getByRole("button", { name: /website trial/i })).toHaveAttribute("aria-expanded", "true");
    await expect(page).toHaveURL(/\/en\/#faq$/);
    await expectNoHorizontalOverflow(page);
  });
}

test("resize and orientation changes preserve homepage state without clipping the front phone", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one deterministic resize path covers all target widths");

  await page.route("**/api/routes/query_places", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ requestId: "resize-places", data: { places: [], expiresAt: "2026-08-25T12:15:00Z" }, error: null }),
  }));
  await page.goto("/zh-hant/");
  await page.locator('[role="group"] button[data-story-id="journey-guidance"]').click();
  await expect(page.getByTestId("hero-story-stage").locator('[data-story-id="journey-guidance"]')).toHaveAttribute("data-slot", "front");

  await page.getByRole("combobox", { name: "起點" }).fill("晨灣匯");
  await page.locator("#faq").getByRole("button", { name: "網站試查和 App 有甚麼分別？" }).click();

  for (const viewport of [
    { width: 1200, height: 900 },
    { width: 390, height: 844 },
    { width: 320, height: 844 },
    { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.getByTestId("hero-story-stage").locator('[data-story-id="journey-guidance"]')).toHaveAttribute("data-slot", "front");
    await expect(page.getByRole("combobox", { name: "起點" })).toHaveValue("晨灣匯");
    await expect(page.locator("#faq").getByRole("button", { name: "網站試查和 App 有甚麼分別？" })).toHaveAttribute("aria-expanded", "true");
    await expectNoHorizontalOverflow(page);
    if (viewport.height >= 844) {
      await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
      await expectFrontPhoneInsideViewport(page);
    }
  }
});
