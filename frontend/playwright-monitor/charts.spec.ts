import { expect, test } from "@playwright/test";
import { overviewEnvelope } from "./fixtures/analytics";
import { detailEnvelopes } from "./fixtures/details";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("busiscoming.monitor.locale", "zh-Hans"));
  await page.route("**/api/analytics/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/overview") ? overviewEnvelope : detailEnvelopes[pathname as keyof typeof detailEnvelopes];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
});

test("shows Grafana-style chart detail and daily heatmap without visible summaries", async ({ page }, testInfo) => {
  await page.goto("/#overview");
  await expect(page.getByRole("list", { name: "图例" })).toContainText("主页 PV");
  await page.getByTestId("chart-point").first().focus();
  await expect(page.getByRole("status")).toContainText("主页 UV");
  await expect(page.locator("figcaption")).toHaveCount(0);
  const fontSize = Number.parseFloat(await page.getByTestId("metric-card").first().locator(".metric-value").evaluate((node) => getComputedStyle(node).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(testInfo.project.name.includes("mobile") ? 36 : 40);

  await page.evaluate(() => { window.location.hash = "traffic"; });
  await expect(page.getByRole("gridcell")).toHaveCount(30);
  await page.getByRole("gridcell").nth(10).focus();
  await expect(page.getByRole("status")).toContainText("独立浏览器 UV");
  await expect(page.locator(".heatmap-scroll")).toHaveCSS("overflow-x", "auto");

  if (testInfo.project.name.includes("mobile")) {
    await page.locator(".language-control select").selectOption("zh-Hant");
    await page.screenshot({ path: "playwright-monitor/__screenshots__/charts-zh-Hant-mobile.png", fullPage: true });
  } else {
    await page.screenshot({ path: "playwright-monitor/__screenshots__/charts-zh-Hans-desktop.png", fullPage: true });
    await page.locator(".language-control select").selectOption("en");
    await page.screenshot({ path: "playwright-monitor/__screenshots__/charts-en-desktop.png", fullPage: true });
  }
});
