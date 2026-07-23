import { expect, test } from "@playwright/test";
import { detailEnvelopes, detailNoComparisonEnvelopes } from "./fixtures/details";

type MonitoringLocale = "zh-Hans" | "zh-Hant" | "en";
const eventPageSize = 50;
const secondPageCursor = encodeEventCursor("2026-07-21T00:12:00Z", 99);

const labels: Record<MonitoringLocale, {
  events: string; traffic: string; next: string; compare: string; comparisonOff: string; secondItemRange: string;
  pageView: string; route: string; cards: [string, string, string, string, string, string];
}> = {
  "zh-Hans": { events: "事件明细", traffic: "流量与试查", next: "下一页", compare: "对比上一周期", comparisonOff: "未启用同期比较", secondItemRange: "第 51–51 条，共 51 条", pageView: "主页访问", route: "路线查询", cards: ["主页浏览 PV", "主页浏览 UV", "地点查询 PV", "地点查询 UV", "路线查询 PV", "路线查询 UV"] },
  "zh-Hant": { events: "事件明細", traffic: "流量與試查", next: "下一頁", compare: "比較上一周期", comparisonOff: "未啟用同期比較", secondItemRange: "第 51–51 項，共 51 項", pageView: "主頁瀏覽", route: "路線查詢", cards: ["主頁瀏覽 PV", "主頁瀏覽 UV", "地點查詢 PV", "地點查詢 UV", "路線查詢 PV", "路線查詢 UV"] },
  en: { events: "Event detail", traffic: "Traffic & trial", next: "Next page", compare: "Compare previous period", comparisonOff: "Period comparison off", secondItemRange: "Items 51–51 of 51", pageView: "Homepage view", route: "Route query", cards: ["Homepage PV", "Homepage UV", "Place-query PV", "Place-query UV", "Route-query PV", "Route-query UV"] },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/analytics/**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    if (pathname.endsWith("/events")) {
      expect(url.searchParams.get("limit")).toBe(String(eventPageSize));
      const compare = url.searchParams.get("compare") !== "false";
      const source = compare ? detailEnvelopes["/api/analytics/events"] : detailNoComparisonEnvelopes["/api/analytics/events"];
      const body = structuredClone(source);
      const cursor = url.searchParams.get("cursor");
      const secondPage = cursor === secondPageCursor;
      if (cursor) expect(decodeEventCursor(cursor)).toEqual({ occurredAtMilliseconds: Date.parse("2026-07-21T00:12:00Z"), eventID: 99n });
      body.data.pageInfo = { ...body.data.pageInfo, limit: eventPageSize, hasMore: !secondPage, nextCursor: secondPage ? null : secondPageCursor, totalCount: eventPageSize + 1 };
      body.data.items = secondPage
        ? [{ ...body.data.items[0], eventId: "98", occurredAt: "2026-07-21T00:11:00Z", eventType: "page_view" }]
        : Array.from({ length: eventPageSize }, (_, index) => ({ ...body.data.items[0], eventId: String(148 - index), occurredAt: new Date(Date.parse("2026-07-21T01:01:00Z") - index * 60_000).toISOString(), eventType: index === 0 ? "route_query" : "place_query" }));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
      return;
    }
    const body = detailEnvelopes[pathname as keyof typeof detailEnvelopes];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
});

test("uses the production EventCursor binary contract for the real second-page response", () => {
  expect(secondPageCursor).toBe("AAABn4ID4IAAAAAAAAAAYw");
  expect(decodeEventCursor(secondPageCursor)).toEqual({ occurredAtMilliseconds: Date.parse("2026-07-21T00:12:00Z"), eventID: 99n });
});

test("keeps event cards stable across a real cursor page, supports comparison on and off, and captures all locale/viewports", async ({ page }, testInfo) => {
  const device = testInfo.project.name.includes("desktop") ? "desktop" : "mobile";
  for (const locale of ["zh-Hans", "zh-Hant", "en"] as const) {
    const copy = labels[locale];
    await page.goto("/#events");
    await page.locator(".language-control select").selectOption(locale);
    await expect(page.getByRole("heading", { name: copy.events })).toBeVisible();
    await page.locator(".global-filters summary").click();
    await page.getByLabel(copy.compare).check();
    await page.locator(".global-filters summary").click();
    const summary = page.locator(".event-summary-grid");
    const eventList = page.locator(testInfo.project.name.includes("desktop") ? ".event-table-wrap" : ".responsive-event-list");
    const firstSummary = await summary.innerText();
    await expect(eventList).toContainText(copy.route);
    await page.getByRole("button", { name: copy.next }).click();
    await expect(eventList).toContainText(copy.pageView);
    expect(await summary.innerText()).toBe(firstSummary);
    await expect(page.locator(".event-results-head b")).toHaveText(copy.secondItemRange);
    await expect(page.getByRole("button", { name: copy.next })).toBeDisabled();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `playwright-monitor/__screenshots__/business-events-${locale}-${device}.png`, fullPage: true });

    await page.locator(".global-filters summary").click();
    await page.getByLabel(copy.compare).uncheck();
    await expect(summary).toContainText(copy.comparisonOff);
    await page.locator(".global-filters summary").click();

    if (testInfo.project.name.includes("desktop")) {
      await page.getByTestId("desktop-sidebar").getByRole("link", { name: copy.traffic }).click();
    } else {
      await page.getByRole("button", { name: /打开导航|開啟導覽|Open navigation/ }).click();
      await page.getByRole("dialog").getByRole("link", { name: copy.traffic }).click();
    }
    const cards = page.locator(".detail-metrics");
    await expect(cards.getByTestId("metric-card")).toHaveCount(6);
    for (const label of copy.cards) await expect(cards).toContainText(label);
    const layout = await cards.evaluate((element) => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth, columns: getComputedStyle(element).gridTemplateColumns.split(" ").length }));
    expect(layout.documentWidth).toBe(layout.viewportWidth);
    expect(layout.columns).toBe(device === "desktop" ? 6 : 2);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `playwright-monitor/__screenshots__/business-traffic-${locale}-${device}.png`, fullPage: true });
  }
});

// 与后端 EncodeEventCursor 一致：大端 Unix 毫秒加事件 ID，再用 raw base64url 编码。
function encodeEventCursor(occurredAt: string, eventID: number): string {
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  view.setBigUint64(0, BigInt(Date.parse(occurredAt)));
  view.setBigUint64(8, BigInt(eventID));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeEventCursor(encoded: string): { occurredAtMilliseconds: number; eventID: bigint } {
  const padded = encoded.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  expect(bytes).toHaveLength(16);
  const view = new DataView(bytes.buffer);
  return { occurredAtMilliseconds: Number(view.getBigUint64(0)), eventID: view.getBigUint64(8) };
}
