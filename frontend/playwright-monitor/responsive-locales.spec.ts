import { expect, test } from "@playwright/test";
import { overviewEnvelope } from "./fixtures/analytics";
import { detailEnvelopes } from "./fixtures/details";

const locales = ["zh-Hans", "zh-Hant", "en"] as const;
const routes = ["overview", "traffic", "downloads", "events", "visitor", "performance", "system"] as const;
const titles = {
  "zh-Hans": { overview: "监控总览", traffic: "流量与试查", downloads: "下载分析", events: "事件明细", visitor: "访客明细", performance: "稳定性 & 时延", system: "系统状态" },
  "zh-Hant": { overview: "監控總覽", traffic: "流量與試查", downloads: "下載分析", events: "事件明細", visitor: "訪客明細", performance: "穩定性及延遲", system: "系統狀態" },
  en: { overview: "Monitoring overview", traffic: "Traffic & trial", downloads: "Downloads", events: "Event detail", visitor: "Visitor detail", performance: "Stability & latency", system: "System status" },
} as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("busiscoming.monitor.locale", "zh-Hans"));
  await page.route("**/api/analytics/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/overview") ? overviewEnvelope : detailEnvelopes[pathname as keyof typeof detailEnvelopes];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
});

test("keeps all workspaces, filters, and investigation context usable in three locales", async ({ page }, testInfo) => {
  await page.goto("/#overview");
  await page.locator(".global-filters summary").click();
  const outcomeGroup = page.locator(".filter-group").filter({ hasText: "结果" });
  await outcomeGroup.getByRole("button", { name: "失败" }).click();
  await expect(page.locator(".filter-count")).toHaveText("1");

  for (const locale of locales) {
    await page.locator(".language-control select").selectOption(locale);
    for (const route of routes) {
      await page.evaluate((nextRoute) => { window.location.hash = nextRoute; }, route);
      await expect(page.getByRole("heading", { level: 1, name: titles[locale][route] })).toBeVisible();
      await expect(page.locator(".filter-count")).toHaveText("1");
      const viewport = testInfo.project.name.includes("desktop") ? "desktop" : "mobile";
      await page.screenshot({ path: `playwright-monitor/__screenshots__/workspace-${route}-${locale}-${viewport}.png`, fullPage: false });
    }
  }

  await page.locator(".language-control select").selectOption("zh-Hans");
  await page.evaluate(() => { window.location.hash = "events"; });
  const eventSurface = testInfo.project.name.includes("desktop") ? page.locator(".event-table-wrap") : page.locator(".responsive-event-card");
  await eventSurface.getByRole("button", { name: "查看访客" }).first().click();
  await expect(page).toHaveURL(/#visitor$/);
  await page.locator(".language-control select").selectOption("en");
  await expect(page.getByRole("heading", { name: "Visitor detail" })).toBeVisible();
  await expect(page.locator(".visitor-identity code")).toHaveText("abcdefghijklmnopqrstuv");
  await expect(page.locator(".filter-count")).toHaveText("1");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("busiscoming.monitor.locale"))).toBe("en");
});
