import { expect, test } from "@playwright/test";
import { detailEnvelopes } from "./fixtures/details";
import { overviewEnvelope } from "./fixtures/analytics";

test.beforeEach(async ({ page, context }, testInfo) => {
  const locale = testInfo.project.name.includes("mobile") ? "zh-Hant" : "zh-Hans";
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:5185" });
  await page.addInitScript((value) => localStorage.setItem("busiscoming.monitor.locale", value), locale);
  await page.route("**/api/analytics/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/overview") ? overviewEnvelope : detailEnvelopes[pathname as keyof typeof detailEnvelopes];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
});

test("keeps stability data visible when the Dropped auxiliary request fails", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "desktop evidence is sufficient for the auxiliary-error panel");
  await page.route("**/api/analytics/system", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ requestId: "system-failure", data: null, error: { code: "ANALYTICS_QUERY_FAILED", message: "受控错误" } }) });
  });
  await page.goto("/#performance");
  await expect(page.getByText("Dropped 暂不可用")).toBeVisible();
  await expect(page.getByRole("table", { name: "公开接口性能" })).toBeVisible();
  await page.screenshot({ path: "playwright-monitor/__screenshots__/performance-system-partial-error.png", fullPage: true });
});

test("preserves custom range, filters, language, visitor and workspace context through an investigation", async ({ page }, testInfo) => {
  await page.goto("/#overview");
  const simplified = testInfo.project.name.includes("desktop");
  const labels = simplified ? { events: "事件明细", visitor: "匿名访客", view: "查看访客", session: "会话 1", copy: "复制完整 ID", copied: "已复制完整匿名 ID" } : { events: "事件明細", visitor: "匿名訪客", view: "查看訪客", session: "工作階段 1", copy: "複製完整 ID", copied: "已複製完整匿名 ID" };
  await page.locator(".global-filters summary").click();
  await page.locator('input[type="date"]').nth(0).fill("2026-07-10");
  await page.locator('input[type="date"]').nth(1).fill("2026-07-20");
  await page.getByRole("button", { name: simplified ? "应用日期" : "套用日期" }).click();
  const outcomeGroup = page.locator(".filter-group").filter({ hasText: simplified ? "结果" : "結果" });
  await outcomeGroup.getByRole("button", { name: simplified ? "失败" : "失敗" }).click();
  await expect(page.locator(".filter-count")).toHaveText("1");
  if (testInfo.project.name.includes("mobile")) {
    await expect(page.locator(".time-series-frame")).toBeVisible();
    const layout = await page.evaluate(() => {
      const nav = document.querySelector<HTMLElement>(".mobile-bottom-nav");
      if (!nav) return null;
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        navWidth: nav.getBoundingClientRect().width,
      };
    });
    expect(layout).not.toBeNull();
    expect(layout?.documentWidth).toBe(layout?.viewportWidth);
    expect(layout?.navWidth).toBeLessThanOrEqual((layout?.viewportWidth ?? 0) - 24);
  }
  const eventLink = testInfo.project.name.includes("desktop")
    ? page.getByTestId("desktop-sidebar").getByRole("link", { name: labels.events })
    : page.getByTestId("mobile-bottom-nav").getByRole("link", { name: labels.events });
  await eventLink.click();
  await expect(page.getByRole("heading", { name: labels.events })).toBeVisible();
  await expect(page.locator('input[type="date"]').nth(0)).toHaveValue("2026-07-10");
  await expect(page.locator(".filter-count")).toHaveText("1");
  const visibleEvent = testInfo.project.name.includes("desktop")
    ? page.locator(".event-table-wrap")
    : page.locator(".responsive-event-card");
  await expect(visibleEvent.getByText("abcdef…stuv").first()).toBeVisible();
  await visibleEvent.getByRole("button", { name: labels.view }).first().click();
  await expect(page.getByRole("heading", { name: labels.visitor })).toBeVisible();
  await expect(page.getByText(labels.session)).toBeVisible();
  await page.getByRole("button", { name: labels.copy }).click();
  await expect(page.getByText(labels.copied)).toBeVisible();
  await page.getByLabel(simplified ? "语言" : "語言").selectOption("en");
  await expect(page.getByRole("heading", { name: "Anonymous visitor" })).toBeVisible();
  await page.getByLabel("Language").selectOption(testInfo.project.name.includes("mobile") ? "zh-Hant" : "zh-Hans");
  await expect(page.locator(".visitor-identity code")).toHaveText("abcdefghijklmnopqrstuv");
  await expect(page.locator(".filter-count")).toHaveText("1");
  const path = testInfo.project.name.includes("desktop") ? "playwright-monitor/__screenshots__/investigation-zh-Hans-desktop.png" : "playwright-monitor/__screenshots__/investigation-zh-Hant-mobile.png";
  await page.screenshot({ path, fullPage: testInfo.project.name.includes("desktop") });
});
