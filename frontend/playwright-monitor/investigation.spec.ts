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
  await page.route("**/api/analytics/system", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ requestId: "system-failure", data: null, error: { code: "ANALYTICS_QUERY_FAILED", message: "受控错误" } }) });
  });
  await page.goto("/#performance");
  const traditional = testInfo.project.name.includes("mobile");
  await expect(page.getByText(traditional ? "Dropped 暫時無法讀取" : "Dropped 暂不可用")).toBeVisible();
  await expect(page.getByRole("table", { name: traditional ? "公開接口效能" : "公开接口性能" })).toBeVisible();
  const path = testInfo.project.name.includes("mobile") ? "playwright-monitor/__screenshots__/performance-system-partial-error-mobile.png" : "playwright-monitor/__screenshots__/performance-system-partial-error-desktop.png";
  await page.screenshot({ path, fullPage: true });
});

test("shows twelve system facts and degrades individual missing probes", async ({ page }, testInfo) => {
  await page.goto("/#system");
  await expect(page.locator("[data-testid='system-fact']")).toHaveCount(12);
  await expect(page.locator(".system-fact dd.no-data")).toHaveCount(0);
  await expect(page.getByText(testInfo.project.name.includes("mobile") ? "SQLite 明細儲存" : "SQLite 明细存储")).toBeVisible();
  const viewport = testInfo.project.name.includes("mobile") ? "mobile" : "desktop";
  for (const locale of ["zh-Hans", "zh-Hant", "en"] as const) {
    await page.getByLabel(/语言|語言|Language/).selectOption(locale);
    await expect(page.locator("[data-testid='system-fact']")).toHaveCount(12);
    if (locale === "zh-Hant") await expect(page.getByText("1 分鐘")).toBeVisible();
    await page.screenshot({ path: `playwright-monitor/__screenshots__/system-v13-${locale}-${viewport}.png`, fullPage: true });
  }
  await page.unroute("**/api/analytics/**");
  await page.route("**/api/analytics/system", async (route) => {
    const body = structuredClone(detailEnvelopes["/api/analytics/system"]);
    body.data.database.todayRowCount = 2;
    body.data.process.uptimeMs = 60_000;
    body.data.sqlite.journalMode = null;
    body.data.privateListener.bindAddress = null;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.reload();
  await expect(page.locator("[data-testid='system-fact']")).toHaveCount(12);
  await expect(page.getByText(testInfo.project.name.includes("mobile") ? "暫無資料" : "无数据")).toHaveCount(2);
  await expect(page.getByText("3.50.4")).toBeVisible();
  await page.screenshot({ path: `playwright-monitor/__screenshots__/system-v13-${viewport}.png`, fullPage: true });
});

test("preserves custom range, filters, language, visitor and workspace context through an investigation", async ({ page }, testInfo) => {
  await page.goto("/#overview");
  const simplified = testInfo.project.name.includes("desktop");
  const labels = simplified ? { events: "事件明细", visitor: "访客明细", view: "查看访客明细", session: "会话 1", copy: "复制完整 ID", copied: "已复制完整匿名 ID" } : { events: "事件明細", visitor: "訪客明細", view: "查看訪客明細", session: "工作階段 1", copy: "複製完整 ID", copied: "已複製完整匿名 ID" };
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
  if (testInfo.project.name.includes("desktop")) {
    await page.getByTestId("desktop-sidebar").getByRole("link", { name: labels.events }).click();
  } else {
    await page.getByRole("button", { name: "開啟導覽" }).click();
    await page.getByRole("dialog").getByRole("link", { name: labels.events }).click();
  }
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
  await expect(page.getByRole("heading", { name: "Visitor detail" })).toBeVisible();
  await page.getByLabel("Language").selectOption(testInfo.project.name.includes("mobile") ? "zh-Hant" : "zh-Hans");
  await expect(page.locator(".visitor-identity code")).toHaveText("abcdefghijklmnopqrstuv");
  await expect(page.locator(".filter-count")).toHaveText("1");
  await page.screenshot({ path: testInfo.project.name.includes("mobile") ? "playwright-monitor/__screenshots__/visitor-v13-mobile.png" : "playwright-monitor/__screenshots__/visitor-v13-desktop.png", fullPage: true });
  const path = testInfo.project.name.includes("desktop") ? "playwright-monitor/__screenshots__/investigation-zh-Hans-desktop.png" : "playwright-monitor/__screenshots__/investigation-zh-Hant-mobile.png";
  await page.screenshot({ path, fullPage: testInfo.project.name.includes("desktop") });
});

test("keeps applied filters, draft date step, percentile and page through a language switch", async ({ page }, testInfo) => {
  const mobile = testInfo.project.name.includes("mobile");
  const labels = mobile ? { filters: "篩選", apply: "套用日期", outcome: "失敗", event: "路線查詢", menu: "開啟導覽", performance: "穩定性及延遲", start: "開始日期" } : { filters: "筛选", apply: "应用日期", outcome: "失败", event: "路线查询", menu: "打开导航", performance: "稳定性 & 时延", start: "开始日期" };
  await page.goto("/#overview");
  await page.getByText(labels.filters, { exact: false }).first().click();
  const dates = page.locator(".global-filters input[type='date']");
  await dates.nth(0).fill("2026-07-10");
  await dates.nth(1).fill("2026-07-20");
  await page.getByRole("button", { name: labels.apply }).click();
  await page.locator(".filter-group").filter({ hasText: labels.outcome }).getByRole("button", { name: labels.outcome }).click();
  await page.locator(".filter-group").filter({ hasText: labels.event }).getByRole("button", { name: labels.event }).click();
  await page.getByRole("checkbox").click();
  if (mobile) {
    await page.getByRole("button", { name: labels.menu }).click();
    await page.getByRole("dialog").getByRole("link", { name: labels.performance }).click();
  } else {
    await page.getByTestId("desktop-sidebar").getByRole("link", { name: labels.performance }).click();
  }
  await page.getByRole("button", { name: "P50", exact: true }).click();
  await page.getByRole("button", { name: /自定义日期|自訂日期/ }).click();
  await page.getByRole("dialog", { name: mobile ? "日期範圍" : "日期范围" }).getByLabel(labels.start).fill("2026-07-12");
  await page.getByLabel(/语言|語言/).selectOption("en");
  await expect(page.getByRole("heading", { name: "Stability & latency" })).toBeVisible();
  await expect(page.getByRole("button", { name: "P50", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("dialog", { name: "Date range" })).toContainText("Step 2: choose an end date");
  await expect(page.locator(".global-filters input[type='date']").nth(0)).toHaveValue("2026-07-10");
  await expect(page.locator(".filter-count")).toHaveText("2");
  await page.getByRole("dialog", { name: "Date range" }).getByRole("button", { name: "Cancel" }).click();
  const filterPanel = page.locator(".global-filters");
  const filterSummary = filterPanel.locator("summary");
  if (await filterPanel.evaluate((element) => element.hasAttribute("open"))) await filterSummary.click();
  await filterSummary.click();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
});

test("compares complete event ranges across pages and shows six traffic cards without changing the three-series trend", async ({ page }, testInfo) => {
  const traditional = testInfo.project.name.includes("mobile");
  const labels = traditional
    ? { events: "事件明細", traffic: "流量與試查", total: "完整時段事件", failed: "失敗事件", homepagePv: "主頁瀏覽 PV", homepageUv: "主頁瀏覽 UV", placePv: "地點查詢 PV", placeUv: "地點查詢 UV", routePv: "路線查詢 PV", routeUv: "路線查詢 UV", comparison: "比較上期" }
    : { events: "事件明细", traffic: "流量与试查", total: "完整范围事件", failed: "失败事件", homepagePv: "主页浏览 PV", homepageUv: "主页浏览 UV", placePv: "地点查询 PV", placeUv: "地点查询 UV", routePv: "路线查询 PV", routeUv: "路线查询 UV", comparison: "对比上期" };
  await page.goto("/#events");
  await expect(page.getByRole("heading", { name: labels.events })).toBeVisible();
  await expect(page.locator(".event-summary-grid [data-testid='metric-card']")).toHaveCount(4);
  await expect(page.locator(".event-summary-grid")).toContainText(labels.total);
  await expect(page.locator(".event-summary-grid")).toContainText(labels.failed);
  await expect(page.locator(".event-summary-grid")).toContainText(labels.comparison);
  await expect(page.getByRole("button", { name: traditional ? "下一頁" : "下一页" })).toBeDisabled();
  if (testInfo.project.name.includes("desktop")) {
    await page.getByTestId("desktop-sidebar").getByRole("link", { name: labels.traffic }).click();
  } else {
    await page.getByRole("button", { name: /打开导航|開啟導覽|Open navigation/ }).click();
    await page.getByRole("dialog").getByRole("link", { name: labels.traffic }).click();
  }
  await expect(page.getByRole("heading", { name: labels.traffic })).toBeVisible();
  for (const label of [labels.homepagePv, labels.homepageUv, labels.placePv, labels.placeUv, labels.routePv, labels.routeUv]) {
    await expect(page.locator(".detail-metrics")).toContainText(label);
  }
  await expect(page.locator(".detail-metrics [data-testid='metric-card']")).toHaveCount(6);
  await expect(page.getByRole("list", { name: traditional ? "圖例" : "图例" })).toContainText(traditional ? "成功路線查詢 UV" : "成功路线查询 UV");
  if (traditional) {
    const width = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    expect(width.document).toBe(width.viewport);
  }
  const path = traditional ? "playwright-monitor/__screenshots__/business-v13-mobile.png" : "playwright-monitor/__screenshots__/business-v13-desktop.png";
  await page.screenshot({ path, fullPage: true });
});
