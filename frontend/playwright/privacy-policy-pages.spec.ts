import { expect, test } from "@playwright/test";

const privacyPages = [
  {
    path: "/zh-hant/privacy/",
    title: "BusIsComing 私隱政策",
    footerLabel: "私隱政策",
    navLabel: "功能介紹",
    navHref: "/zh-hant/#features",
  },
  {
    path: "/zh-hans/privacy/",
    title: "BusIsComing 隐私政策",
    footerLabel: "隐私政策",
    navLabel: "功能介绍",
    navHref: "/zh-hans/#features",
  },
  {
    path: "/en/privacy/",
    title: "BusIsComing Privacy Policy",
    footerLabel: "Privacy Policy",
    navLabel: "Features",
    navHref: "/en/#features",
  },
];

for (const privacyPage of privacyPages) {
  test(`privacy page renders for ${privacyPage.path}`, async ({ page }, testInfo) => {
    await page.goto(privacyPage.path);

    await expect(page.getByRole("heading", { level: 1, name: privacyPage.title })).toBeVisible();
    await expect(page.getByText("2026-06-30")).toBeVisible();
    await expect(page.getByText("hezhenyu966@gmail.com").first()).toBeVisible();
    await expect(page.getByText(/Citybus|城巴/).first()).toBeVisible();
    await expect(page.getByText("Google Geocoding API").first()).toBeVisible();
    await expect(page.getByTitle("English")).toHaveCount(0);
    await expect(page.locator('header a[data-nav-id="features"]')).toHaveAttribute("href", privacyPage.navHref);
    await expect(page.locator("footer").getByRole("link", { name: privacyPage.footerLabel })).toHaveAttribute("href", privacyPage.path);

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(horizontalOverflow).toBe(false);

    await page.screenshot({
      path: `../specs/008-privacy-policy-pages/visual-review/${testInfo.project.name}-${privacyPage.path
        .replaceAll("/", "-")
        .replace(/^-|-$/g, "")}.png`,
      fullPage: true,
    });
  });
}
