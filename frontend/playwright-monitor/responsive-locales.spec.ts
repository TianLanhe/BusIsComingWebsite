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
const navLabels = {
  "zh-Hans": { overview: "总览", traffic: "流量与试查", downloads: "下载分析", events: "事件明细", visitor: "访客明细", performance: "稳定性 & 时延", system: "系统状态" },
  "zh-Hant": { overview: "總覽", traffic: "流量與試查", downloads: "下載分析", events: "事件明細", visitor: "訪客明細", performance: "穩定性及延遲", system: "系統狀態" },
  en: { overview: "Overview", traffic: "Traffic & trial", downloads: "Downloads", events: "Event detail", visitor: "Visitor detail", performance: "Stability & latency", system: "System status" },
} as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("busiscoming.monitor.locale", "zh-Hans"));
  await page.route("**/api/analytics/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/overview") ? overviewEnvelope : detailEnvelopes[pathname as keyof typeof detailEnvelopes];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
});

test("reaches every workspace through real three-group navigation in three locales", async ({ page }, testInfo) => {
  await page.goto("/#overview");
  const groups = { "zh-Hans": ["业务监控", "技术监控", "数据明细"], "zh-Hant": ["業務監控", "技術監控", "數據明細"], en: ["Business monitoring", "Technical monitoring", "Data detail"] } as const;
  const mobileMenu = { "zh-Hans": "打开导航", "zh-Hant": "開啟導覽", en: "Open navigation" } as const;

  for (const locale of locales) {
    await page.locator(".language-control select").selectOption(locale);
    if (testInfo.project.name.includes("desktop")) {
      for (const group of groups[locale]) await expect(page.getByTestId("desktop-sidebar").getByRole("navigation", { name: group })).toBeVisible();
      await expect(page.getByTestId("desktop-sidebar").getByRole("link")).toHaveCount(7);
    } else {
      await expect(page.getByTestId("mobile-bottom-nav").getByRole("link")).toHaveCount(3);
      for (const group of groups[locale]) await expect(page.getByTestId("mobile-bottom-nav").getByRole("link", { name: group })).toBeVisible();
      const targets = await page.getByTestId("mobile-bottom-nav").getByRole("link").evaluateAll((links) => links.map((link) => Math.min(link.getBoundingClientRect().width, link.getBoundingClientRect().height)));
      expect(targets.every((target) => target >= 44)).toBeTruthy();
      for (const route of ["overview", "performance", "events"] as const) {
        await page.getByTestId("mobile-bottom-nav").getByRole("link", { name: groups[locale][route === "overview" ? 0 : route === "performance" ? 1 : 2] }).click();
        await expect(page.getByRole("heading", { level: 1, name: titles[locale][route] })).toBeVisible();
      }
    }
    for (const route of routes) {
      if (testInfo.project.name.includes("desktop")) {
        await page.getByTestId("desktop-sidebar").getByRole("link", { name: navLabels[locale][route] }).click();
      } else {
        await page.getByRole("button", { name: mobileMenu[locale] }).click();
        const drawer = page.getByRole("dialog");
        await expect(drawer.getByRole("link")).toHaveCount(7);
        await drawer.getByRole("link", { name: navLabels[locale][route] }).click();
      }
      await expect(page.getByRole("heading", { level: 1, name: titles[locale][route] })).toBeVisible();
      const active = testInfo.project.name.includes("desktop") ? page.getByTestId("desktop-sidebar") : page.getByRole("dialog");
      if (!testInfo.project.name.includes("desktop")) {
        await page.getByRole("button", { name: mobileMenu[locale] }).click();
      }
      await expect(active.getByRole("link", { name: navLabels[locale][route] })).toHaveAttribute("aria-current", "page");
      if (!testInfo.project.name.includes("desktop")) await page.getByRole("button", { name: /关闭|關閉|Close/ }).click();
    }
  }
});
