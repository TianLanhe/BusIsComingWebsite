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
});

function renderDetail(element: React.ReactElement) {
  return render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider now={() => new Date("2026-07-21T00:00:00+08:00")}>{element}</FilterProvider></MonitoringI18nProvider>);
}

function eventPage(nextCursor: string | null): EventListData {
  return {
    meta: { from: "2026-06-21T00:00:00+08:00", to: "2026-07-21T00:00:00+08:00", timezone: "Asia/Hong_Kong", granularity: "day", compare: false, comparisonFrom: null, comparisonTo: null, appliedFilters: { locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [], eventType: [] }, generatedAt: "2026-07-21T01:00:00Z", state: "ready" },
    summary: { totalCount: 51, successCount: 40, failureCount: 11, uniqueVisitors: 22 },
    summaryMetrics: [],
    items: [{ eventId: "99", occurredAt: "2026-07-21T00:00:00Z", visitorId: "abcdefghijklmnopqrstuv", eventType: "route_query", outcome: "success", httpStatus: 200, statusClass: "2xx", failureCategory: null, durationMs: 420, locale: "zh-Hant", deviceType: "mobile", sourceType: "direct", download: null }],
    pageInfo: { limit: 50, nextCursor, hasMore: nextCursor != null, totalCount: 51 },
  };
}
