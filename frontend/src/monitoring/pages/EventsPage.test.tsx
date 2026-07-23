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
});

function renderDetail(element: React.ReactElement) {
  return render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider now={() => new Date("2026-07-21T00:00:00+08:00")}>{element}</FilterProvider></MonitoringI18nProvider>);
}

function eventPage(nextCursor: string | null, compare = false): EventListData {
  return {
    meta: { from: "2026-06-21T00:00:00+08:00", to: "2026-07-21T00:00:00+08:00", timezone: "Asia/Hong_Kong", granularity: "day", compare, comparisonFrom: compare ? "2026-05-22T00:00:00+08:00" : null, comparisonTo: compare ? "2026-06-21T00:00:00+08:00" : null, appliedFilters: { locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [], eventType: [] }, generatedAt: "2026-07-21T01:00:00Z", state: "ready" },
    summary: { totalCount: 51, successCount: 40, failureCount: 11, uniqueVisitors: 22 },
    summaryMetrics: [
      { key: "totalCount", value: 51, previousValue: 40, delta: 11, deltaRate: .275 },
      { key: "successCount", value: 40, previousValue: 41, delta: -1, deltaRate: -.024 },
      { key: "failureCount", value: 11, previousValue: 3, delta: 8, deltaRate: 2.667 },
      { key: "uniqueVisitors", value: 22, previousValue: 22, delta: 0, deltaRate: 0 },
    ],
    items: [{ eventId: "99", occurredAt: "2026-07-21T00:00:00Z", visitorId: "abcdefghijklmnopqrstuv", eventType: "route_query", outcome: "success", httpStatus: 200, statusClass: "2xx", failureCategory: null, durationMs: 420, locale: "zh-Hant", deviceType: "mobile", sourceType: "direct", download: null }],
    pageInfo: { limit: 50, nextCursor, hasMore: nextCursor != null, totalCount: 51 },
  };
}
