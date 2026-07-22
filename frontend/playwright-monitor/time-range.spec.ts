import { expect, test } from "@playwright/test";
import { overviewEnvelope } from "./fixtures/analytics";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-07-23T00:30:00+08:00"));
  await page.addInitScript(() => localStorage.setItem("busiscoming.monitor.locale", "zh-Hans"));
  await page.route("**/api/analytics/overview?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overviewEnvelope) });
  });
});

test("includes today and validates custom Hong Kong dates", async ({ page }, testInfo) => {
  await page.goto("/#overview");
  await page.locator(".global-filters summary").click();
  await page.getByRole("button", { name: "近 7 天" }).click();
  await page.getByLabel("开始日期").fill("2026-07-24");
  await page.getByLabel("结束日期").fill("2026-07-23");
  await page.getByRole("button", { name: "应用日期" }).click();
  await expect(page.getByRole("alert")).toContainText("开始日期不能晚于结束日期");

  await page.getByLabel("开始日期").fill("2026-07-20");
  await page.getByLabel("结束日期").fill("2026-07-23");
  await page.getByRole("button", { name: "应用日期" }).click();
  await expect(page.getByLabel("开始日期")).toHaveValue("2026-07-20");

  const target = testInfo.project.name.includes("desktop")
    ? "playwright-monitor/__screenshots__/time-range-desktop.png"
    : "playwright-monitor/__screenshots__/time-range-mobile.png";
  await page.screenshot({ path: target, fullPage: true });
});
