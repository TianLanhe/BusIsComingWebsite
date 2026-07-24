import { expect, test } from "@playwright/test";
import { overviewEnvelope } from "./fixtures/analytics";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/analytics/overview?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overviewEnvelope) });
  });
  await page.addInitScript(() => localStorage.setItem("busiscoming.monitor.locale", "zh-Hans"));
});

test("overview matches the approved desktop and mobile interaction contract", async ({ page }, testInfo) => {
  await page.goto("/#overview");
  await expect(page.getByRole("heading", { name: "监控总览" })).toBeVisible();
  await expect(page.getByText("页面浏览量 PV")).toBeVisible();
  await expect(page.getByRole("heading", { name: "访问趋势" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "试查漏斗" })).toBeVisible();

  if (testInfo.project.name.includes("desktop")) {
    await expect(page.locator("[data-testid=desktop-sidebar]")).toBeVisible();
    await expect(page.locator(".sidebar-status")).toHaveCount(0);
    await expect(page.locator("[data-testid=metric-card]")).toHaveCount(6);
    await page.screenshot({ path: "playwright-monitor/__screenshots__/overview-desktop.png", fullPage: true });
  } else {
    await expect(page.locator("[data-testid=mobile-bottom-nav]")).toBeVisible();
    await expect(page.locator(".monitor-health")).toContainText("Asia/Hong_Kong");
    await expect(page.locator("[data-testid=metric-grid]")).toHaveCSS("grid-template-columns", /.+ .+/);
    await page.screenshot({ path: "playwright-monitor/__screenshots__/overview-mobile.png" });
  }
});
