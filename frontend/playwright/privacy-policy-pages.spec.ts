import { expect, test } from "@playwright/test";

const privacyPages = [
  {
    path: "/zh-hant/privacy/",
    title: "BusIsComing 私隱政策",
    footerLabel: "私隱政策",
    backLabel: "返回首頁",
    homeHref: "/zh-hant/",
  },
  {
    path: "/zh-hans/privacy/",
    title: "BusIsComing 隐私政策",
    footerLabel: "隐私政策",
    backLabel: "返回首页",
    homeHref: "/zh-hans/",
  },
  {
    path: "/en/privacy/",
    title: "BusIsComing Privacy Policy",
    footerLabel: "Privacy Policy",
    backLabel: "Back to homepage",
    homeHref: "/en/",
  },
];

for (const privacyPage of privacyPages) {
  test(`privacy page renders for ${privacyPage.path}`, async ({ page }) => {
    await page.goto(privacyPage.path);

    await expect(page.getByRole("heading", { level: 1, name: privacyPage.title })).toBeVisible();
    await expect(page.getByText("2026-07-22")).toBeVisible();
    await expect(page.getByText("hezhenyu966@gmail.com").first()).toBeVisible();
    await expect(page.getByText(/Citybus|城巴/).first()).toBeVisible();
    await expect(page.getByText("Google Geocoding API").first()).toBeVisible();
    await expect(page.getByTitle("English")).toHaveCount(0);
    await expect(page.getByTestId("privacy-chrome").getByRole("link", { name: privacyPage.backLabel })).toHaveAttribute("href", privacyPage.homeHref);
    await expect(page.getByTestId("privacy-chrome").getByRole("img", { name: "BusIsComing" })).toBeVisible();

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(horizontalOverflow).toBe(false);

  });
}
