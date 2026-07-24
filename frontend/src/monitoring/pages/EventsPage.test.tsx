import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterProvider } from "../app/FilterProvider";
import { MonitoringI18nProvider } from "../app/MonitoringI18nProvider";
import type { EventListData } from "../services/analyticsTypes";
import { EventsPage } from "./EventsPage";

describe("EventsPage", () => {
  it("truncates visitor IDs, paginates with cursor, and exposes no mutation/export action", async () => {
    const loader = vi.fn(async (_query, _visitor) => eventPage(loader.mock.calls.length === 1 ? "next-cursor" : null));
    renderDetail(<EventsPage loadEvents={loader} />);
    expect((await screen.findAllByText("abcdef…stuv")).length).toBeGreaterThan(0);
    expect(screen.queryByText("abcdefghijklmnopqrstuv")).not.toBeInTheDocument();
    expect(screen.queryByText(/导出|删除|编辑/)).not.toBeInTheDocument();
    expect(screen.getByText("完整范围事件")).toBeInTheDocument();
    expect(screen.getByText("成功事件")).toBeInTheDocument();
    expect(screen.getByText("失败事件")).toBeInTheDocument();
    expect(screen.getByText("独立浏览器")).toBeInTheDocument();
    expect(screen.getByText("第 1–1 条，共 51 条")).toBeInTheDocument();
    expect(screen.getAllByText("第 1 页").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(await screen.findByRole("heading", { name: "事件明细" })).toBeInTheDocument();
    expect(loader.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ cursor: "next-cursor" }));
  });

  it("keeps compare enabled for full-range cards while pagination changes only the table", async () => {
    const loader = vi.fn(async (query) => eventPage(loader.mock.calls.length === 1 ? "next-cursor" : null, query.compare));
    renderDetail(<EventsPage loadEvents={loader} />);
    await screen.findByText("完整范围事件");
    expect(loader.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ compare: true, cursor: undefined }));
    expect(screen.getAllByText("对比上期").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    await screen.findByRole("heading", { name: "事件明细" });
    expect(loader.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ compare: true, cursor: "next-cursor" }));
    expect(screen.getAllByText("对比上期").length).toBeGreaterThan(0);
  });

  it.each([
    ["increased", { value: 51, previousValue: 40, delta: 11, deltaRate: .275 }, true, "+27.5%", "对比上期", "worse"],
    ["decreased", { value: 30, previousValue: 40, delta: -10, deltaRate: -.25 }, true, "-25%", "对比上期", "better"],
    ["unchanged", { value: 40, previousValue: 40, delta: 0, deltaRate: 0 }, true, "0", "较上期持平", "neutral"],
    ["zero baseline", { value: 11, previousValue: 0, delta: 11, deltaRate: null }, true, "+11", "上期为零，显示绝对变化", "worse"],
    ["no previous", { value: 11, previousValue: null, delta: null, deltaRate: null }, true, "11", "暂无同期数据", "neutral"],
    ["no current", { value: null, previousValue: 11, delta: null, deltaRate: null }, true, "—", "暂无当前数据", "neutral"],
    ["disabled", { value: 11, previousValue: 3, delta: 8, deltaRate: 2.667 }, false, "11", "未启用同期比较", "neutral"],
  ] as const)("renders the real %s event-comparison state with localized count semantics", async (_name, failure, compare, value, copy, outcome) => {
    renderDetail(<EventsPage loadEvents={async () => eventPage(null, compare, failure)} />);
    const label = await screen.findByText("失败事件");
    const card = label.closest("article");
    expect(card).not.toBeNull();
    expect(card).toHaveTextContent(value);
    expect(card).toHaveTextContent(copy);
    expect(card?.querySelector(".metric-comparison")).toHaveClass(outcome);
  });

  it("marks an increased failure count as worse and a decreased failure count as better", async () => {
    const { unmount } = renderDetail(<EventsPage loadEvents={async () => eventPage(null, true, { value: 11, previousValue: 3, delta: 8, deltaRate: 2.667 })} />);
    const worse = (await screen.findByText("失败事件")).closest("article")?.querySelector(".metric-comparison");
    expect(worse).toHaveClass("worse");
    unmount();
    renderDetail(<EventsPage loadEvents={async () => eventPage(null, true, { value: 3, previousValue: 11, delta: -8, deltaRate: -.727 })} />);
    const better = (await screen.findByText("失败事件")).closest("article")?.querySelector(".metric-comparison");
    expect(better).toHaveClass("better");
  });
});

function renderDetail(element: React.ReactElement) {
  return render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider now={() => new Date("2026-07-21T00:00:00+08:00")}>{element}</FilterProvider></MonitoringI18nProvider>);
}

function eventPage(nextCursor: string | null, compare = false, failure?: Omit<EventListData["summaryMetrics"][number], "key">): EventListData {
  return {
    meta: { from: "2026-06-21T00:00:00+08:00", to: "2026-07-21T00:00:00+08:00", timezone: "Asia/Hong_Kong", granularity: "day", compare, comparisonFrom: compare ? "2026-05-22T00:00:00+08:00" : null, comparisonTo: compare ? "2026-06-21T00:00:00+08:00" : null, appliedFilters: { locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [], eventType: [] }, generatedAt: "2026-07-21T01:00:00Z", state: "ready" },
    summary: { totalCount: 51, successCount: 40, failureCount: 11, uniqueVisitors: 22 },
    summaryMetrics: [
      { key: "totalCount", value: 51, previousValue: 40, delta: 11, deltaRate: .275 },
      { key: "successCount", value: 40, previousValue: 41, delta: -1, deltaRate: -.024 },
      failure ? { key: "failureCount", ...failure } : { key: "failureCount", value: 11, previousValue: 3, delta: 8, deltaRate: 2.667 },
      { key: "uniqueVisitors", value: 22, previousValue: 22, delta: 0, deltaRate: 0 },
    ],
    items: [{ eventId: "99", occurredAt: "2026-07-21T00:00:00Z", visitorId: "abcdefghijklmnopqrstuv", eventType: "route_query", outcome: "success", httpStatus: 200, statusClass: "2xx", failureCategory: null, durationMs: 420, locale: "zh-Hant", deviceType: "mobile", sourceType: "direct", download: null }],
    pageInfo: { limit: 50, nextCursor, hasMore: nextCursor != null, totalCount: 51 },
  };
}
