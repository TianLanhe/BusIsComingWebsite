import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonitoringI18nProvider } from "../app/MonitoringI18nProvider";
import { FilterProvider } from "../app/FilterProvider";
import { AnalyticsClientError } from "../services/analyticsClient";
import type { OverviewData } from "../services/analyticsTypes";
import { OverviewPage } from "./OverviewPage";

describe("OverviewPage", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders loading and the complete overview dashboard", async () => {
    let resolve: (value: OverviewData) => void = () => undefined;
    const pending = new Promise<OverviewData>((done) => { resolve = done; });
    renderOverview(() => pending);
    expect(screen.getByText("正在载入匿名统计")).toBeInTheDocument();
    resolve(readyOverview());
    expect(await screen.findByText("页面浏览量 PV")).toBeInTheDocument();
    expect(screen.getByText("访问趋势")).toBeInTheDocument();
    expect(screen.getByText("试查漏斗")).toBeInTheDocument();
    expect(screen.getByText("响应时间 P95")).toBeInTheDocument();
    expect(screen.getByText("下载漏斗与版本")).toBeInTheDocument();
  });

  it.each([
    ["no_data", "所选时间范围暂无统计数据"],
    ["no_results", "当前筛选条件没有结果"],
  ] as const)("renders %s distinctly", async (state, copy) => {
    renderOverview(async () => ({ ...readyOverview(), meta: { ...readyOverview().meta, state } }));
    expect(await screen.findByText(copy)).toBeInTheDocument();
  });

  it.each([
    [new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 500), "统计查询暂时失败"],
    [new AnalyticsClientError("ANALYTICS_STORAGE_UNAVAILABLE", 503), "统计数据库暂时不可用"],
  ])("renders safe error state", async (error, copy) => {
    renderOverview(async () => { throw error; });
    expect(await screen.findByText(copy)).toBeInTheDocument();
  });

  it("refreshes 60 seconds after success without overlapping requests", async () => {
    vi.useFakeTimers();
    let calls = 0;
    let resolveSecond: (value: OverviewData) => void = () => undefined;
    const loader = vi.fn(async () => {
      calls += 1;
      if (calls === 2) {
        return new Promise<OverviewData>((resolve) => { resolveSecond = resolve; });
      }
      return readyOverview();
    });
    renderOverview(loader);
    await act(async () => { await Promise.resolve(); });
    expect(loader).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(loader).toHaveBeenCalledTimes(2);
    await act(async () => { vi.advanceTimersByTime(120_000); });
    expect(loader).toHaveBeenCalledTimes(2);
    await act(async () => {
      resolveSecond(readyOverview());
      await Promise.resolve();
    });
    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });
    expect(loader).toHaveBeenCalledTimes(3);
  });
});

function renderOverview(loader: () => Promise<OverviewData>) {
  return render(
    <MonitoringI18nProvider initialLocale="zh-Hans">
      <FilterProvider now={() => new Date("2026-07-21T00:00:00+08:00")}>
        <OverviewPage loadOverview={loader} />
      </FilterProvider>
    </MonitoringI18nProvider>,
  );
}

function readyOverview(): OverviewData {
  const metric = (key: string, value: number) => ({ key, value, previousValue: value - 1, delta: 1, deltaRate: 0.1 });
  return {
    meta: {
      from: "2026-06-21T00:00:00+08:00", to: "2026-07-21T00:00:00+08:00", timezone: "Asia/Hong_Kong", granularity: "day", compare: true,
      comparisonFrom: "2026-05-22T00:00:00+08:00", comparisonTo: "2026-06-21T00:00:00+08:00",
      appliedFilters: { locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [], eventType: [] },
      generatedAt: "2026-07-21T01:16:42Z", state: "ready",
    },
    metrics: [metric("pv", 12480), metric("uv", 3216), metric("viewsPerVisitor", 3.88), metric("successfulRouteQueries", 846), metric("downloadRequests", 318), metric("requestSuccessRate", 0.982)],
    trafficSeries: [{ bucketStart: "2026-07-20T00:00:00+08:00", bucketEnd: "2026-07-21T00:00:00+08:00", pv: 480, uv: 216, successfulPlaceVisitors: 144, successfulRouteVisitors: 84 }],
    trialFunnel: { key: "trial", sessionGapMinutes: 30, stages: [{ key: "homepage", uniqueVisitors: 3216, fromPreviousRate: null, fromFirstRate: null }, { key: "successful_place_query", uniqueVisitors: 2444, fromPreviousRate: .76, fromFirstRate: .76 }, { key: "successful_route_query", uniqueVisitors: 1564, fromPreviousRate: .64, fromFirstRate: .49 }] },
    downloadFunnel: { key: "download", sessionGapMinutes: 30, stages: [{ key: "homepage", uniqueVisitors: 3216, fromPreviousRate: null, fromFirstRate: null }, { key: "successful_download_response", uniqueVisitors: 692, fromPreviousRate: .215, fromFirstRate: .215 }] },
    eventComposition: [{ key: "page_view", count: 12480, ratio: .44 }, { key: "place_query", count: 5906, ratio: .32 }],
    latency: { requestCount: 17742, p50Ms: 28, p95Ms: 640 },
    downloadPlatforms: [{ key: "android", count: 318, ratio: 1 }],
    downloadVersions: [{ platform: "android", versionName: "1.0", versionCode: 1, requestCount: 318, successfulResponses: 315, uv: 292, sizeBytes: 20_000_000 }],
  };
}
