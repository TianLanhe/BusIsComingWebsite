import { expect, test } from "@playwright/test";
import { overviewEnvelope } from "./fixtures/analytics";
import { detailEnvelopes, systemFailureEnvelope } from "./fixtures/details";

const states = ["loading", "no_data", "no_results", "query_failed", "storage_unavailable"] as const;
const headings = {
  loading: "正在载入匿名统计",
  no_data: "所选时间范围暂无统计数据",
  no_results: "当前筛选条件没有结果",
  query_failed: "统计查询暂时失败",
  storage_unavailable: "统计数据库暂时不可用",
} as const;

for (const state of states) {
  test(`${state} keeps its state contract and visual baseline`, async ({ page }, testInfo) => {
    let requestCount = 0;
    await page.addInitScript(() => localStorage.setItem("busiscoming.monitor.locale", "zh-Hans"));
    await page.route("**/api/analytics/overview?**", async (route) => {
      requestCount += 1;
      if (state === "loading") return new Promise(() => {});
      if (state === "query_failed" || state === "storage_unavailable") {
        const code = state === "storage_unavailable" ? "ANALYTICS_STORAGE_UNAVAILABLE" : "ANALYTICS_QUERY_FAILED";
        await route.fulfill({ status: state === "storage_unavailable" ? 503 : 500, contentType: "application/json", body: JSON.stringify({ requestId: "state", data: null, error: { code, message: "safe" } }) });
        return;
      }
      const body = structuredClone(overviewEnvelope);
      body.data.meta.state = state;
      if (state !== "ready") body.data.metrics = [];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });

    await page.setViewportSize(testInfo.project.name.includes("desktop") ? { width: 1440, height: 1000 } : { width: 390, height: 1640 });
    await page.goto("/#overview");
    await expect(page.getByRole("heading", { name: headings[state] })).toBeVisible();

    if (state === "no_results" || state === "query_failed") {
      await page.locator(".global-filters summary").click();
      await page.locator(".filter-group").filter({ hasText: "结果" }).getByRole("button", { name: "失败" }).click();
      await expect(page.locator(".filter-count")).toHaveText("1");
    }
    if (state === "query_failed") {
      const beforeRetry = requestCount;
      await page.locator(".global-filters summary").click();
      await page.getByRole("button", { name: "重试查询" }).click();
      await expect.poll(() => requestCount).toBeGreaterThan(beforeRetry);
      await expect(page.locator(".filter-count")).toHaveText("1");
    }
    const viewport = testInfo.project.name.includes("desktop") ? "desktop" : "mobile";
    await page.screenshot({ path: `playwright-monitor/__screenshots__/state-${state}-${viewport}.png`, fullPage: false });
  });
}

test("system failure only degrades Dropped on the performance workspace", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "desktop evidence is sufficient for this local partial failure");
  await page.addInitScript(() => localStorage.setItem("busiscoming.monitor.locale", "zh-Hans"));
  await page.route("**/api/analytics/performance?**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detailEnvelopes["/api/analytics/performance"]) }));
  await page.route("**/api/analytics/system", async (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify(systemFailureEnvelope) }));
  await page.goto("/#performance");
  await expect(page.getByRole("table", { name: "公开接口性能" })).toBeVisible();
  await expect(page.getByText("Dropped 暂不可用")).toBeVisible();
  await expect(page.getByRole("heading", { name: "统计查询暂时失败" })).toHaveCount(0);
  await page.screenshot({ path: "playwright-monitor/__screenshots__/performance-system-partial-error.png", fullPage: true });
});
