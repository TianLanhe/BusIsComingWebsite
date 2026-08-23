import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers/homepageVisual";

for (const locale of ["zh-hant", "zh-hans", "en"] as const) {
  test(`${locale} preserves active story and FAQ state through in-page language switching`, async ({ page }) => {
    await page.goto(`/${locale}/#faq`);
    await page.locator('[role="group"] button[data-story-id="journey-guidance"]').click();
    const faq = page.locator("#faq");
    await faq.getByRole("button", { name: /網站試查|网站试查|website trial/i }).click();
    const language = page.locator("header").getByRole("button", { name: /選擇語言|选择语言|Choose language/ });
    await language.click();
    await page.getByRole("menuitem", { name: "English" }).click();
    await expect(page.getByTestId("hero-story-stage").locator('[data-story-id="journey-guidance"]')).toHaveAttribute("data-slot", "front");
    await expect(faq.getByRole("button", { name: /website trial/i })).toHaveAttribute("aria-expanded", "true");
    await expect(page).toHaveURL(/\/en\/#faq$/);
    await expectNoHorizontalOverflow(page);
  });
}
