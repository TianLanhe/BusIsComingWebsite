import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilterProvider } from "../app/FilterProvider";
import { MonitoringI18nProvider } from "../app/MonitoringI18nProvider";
import { DownloadsPage } from "./DownloadsPage";
import { PerformancePage } from "./PerformancePage";
import { SystemPage } from "./SystemPage";
import { TrafficPage } from "./TrafficPage";
import { VisitorPage } from "./VisitorPage";
import type { DownloadsData, PerformanceData, SystemData, TrafficData, VisitorData } from "../services/analyticsTypes";

describe("detail workspaces", () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it.each([
    ["traffic", <TrafficPage loadTraffic={async () => traffic()} />, "访问时段热力图"],
    ["downloads", <DownloadsPage loadDownloads={async () => downloads()} />, "版本表现"],
    ["performance", <PerformancePage loadPerformance={async () => performance()} />, "公开接口性能"],
    ["system", <SystemPage loadSystem={async () => system()} />, "SQLite 明细存储"],
  ])("renders %s data shape", async (_name, page, expected) => {
    renderDetail(page as React.ReactElement);
    expect((await screen.findAllByText(expected as string)).length).toBeGreaterThan(0);
  });

  it("does not auto-refresh detail pages under fake timers", async () => {
    vi.useFakeTimers();
    const loader = vi.fn(async () => traffic());
    renderDetail(<TrafficPage loadTraffic={loader} />);
    await act(async () => { await Promise.resolve(); });
    expect(loader).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(180_000); await Promise.resolve(); });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("renders six homepage/place/route PV/UV cards while preserving the three trend series", async () => {
    const data = traffic();
    data.metrics = [
      { key: "pv", value: 10, previousValue: null, delta: null, deltaRate: null },
      { key: "uv", value: 5, previousValue: null, delta: null, deltaRate: null },
      { key: "placeQueryRequests", value: 6, previousValue: null, delta: null, deltaRate: null },
      { key: "placeQueryVisitors", value: 4, previousValue: null, delta: null, deltaRate: null },
      { key: "routeQueryRequests", value: 5, previousValue: null, delta: null, deltaRate: null },
      { key: "routeQueryVisitors", value: 3, previousValue: null, delta: null, deltaRate: null },
      { key: "successfulPlaceVisitors", value: 4, previousValue: null, delta: null, deltaRate: null },
      { key: "successfulRouteVisitors", value: 3, previousValue: null, delta: null, deltaRate: null },
    ];
    data.series = [{ bucketStart: meta.from, bucketEnd: meta.to, pv: 10, uv: 5, successfulPlaceVisitors: 4, successfulRouteVisitors: 3 }];
    renderDetail(<TrafficPage loadTraffic={async () => data} />);
    expect(await screen.findByText("主页浏览 PV")).toBeInTheDocument();
    expect(screen.getByText("主页浏览 UV")).toBeInTheDocument();
    expect(screen.getByText("地点查询 PV")).toBeInTheDocument();
    expect(screen.getByText("地点查询 UV")).toBeInTheDocument();
    expect(screen.getByText("路线查询 PV")).toBeInTheDocument();
    expect(screen.getByText("路线查询 UV")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "图例" })).toHaveTextContent("主页 PV");
    expect(screen.getByRole("list", { name: "图例" })).toHaveTextContent("主页 UV");
    expect(screen.getByRole("list", { name: "图例" })).toHaveTextContent("成功路线查询 UV");
  });

  it("loads a visitor from the header-only identifier and announces copy feedback", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    const loader = vi.fn(async () => visitor());
    renderDetail(<VisitorPage initialVisitorID="abcdefghijklmnopqrstuv" loadVisitor={loader} />);
    expect(await screen.findByText("会话 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "复制完整 ID" }));
    expect(await screen.findByText("已复制完整匿名 ID")).toHaveAttribute("aria-live", "polite");
    expect(loader).toHaveBeenCalledWith("abcdefghijklmnopqrstuv", 50, undefined, expect.anything());
  });
});

function renderDetail(element: React.ReactElement) { return render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider now={() => new Date("2026-07-21T00:00:00+08:00")}>{element}</FilterProvider></MonitoringI18nProvider>); }
const meta = { from: "2026-06-21T00:00:00+08:00", to: "2026-07-21T00:00:00+08:00", timezone: "Asia/Hong_Kong" as const, granularity: "day" as const, compare: false, comparisonFrom: null, comparisonTo: null, appliedFilters: { locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [], eventType: [] }, generatedAt: "2026-07-21T01:00:00Z", state: "ready" as const };
function traffic(): TrafficData { return { meta, metrics: [], series: [], trialFunnel: { key: "trial", sessionGapMinutes: 30, stages: [] }, heatmap: Array.from({ length: 30 }, (_, i) => { const localDate = `2026-07-${String(i + 1).padStart(2, "0")}`; return { localDate, bucketStart: `${localDate}T00:00:00+08:00`, bucketEnd: `${localDate}T23:59:59+08:00`, eventCount: i % 7, uv: i % 4 }; }), locales: [], devices: [], sources: [] }; }
function downloads(): DownloadsData { return { meta, metrics: [], series: [], downloadFunnel: { key: "download", sessionGapMinutes: 30, stages: [] }, platforms: [], versions: [{ platform: "android", versionName: "1.0", versionCode: 1, requestCount: 10, successfulResponses: 9, uv: 8, sizeBytes: 20_000_000 }], failures: [] }; }
function performance(): PerformanceData { return { meta, metrics: [], endpoints: [{ operationId: "queryRouteOptions", eventType: "route_query", requestCount: 10, successRate: .9, p50Ms: 200, p50Comparison: { currentMs: 200, previousMs: null, deltaMs: null, deltaRate: null }, p95Ms: 600, p95Comparison: { currentMs: 600, previousMs: null, deltaMs: null, deltaRate: null } }], latencySeries: [], sliSeries: [], failures: [] }; }
function system(): SystemData { return { generatedAt: meta.generatedAt, database: { state: "available", rowCount: 100, todayLocalDate: "2026-07-21", todayRowCount: 0, sizeBytes: 4096, lastSuccessfulWriteAt: meta.generatedAt }, sqlite: { version: "3.50.4", journalMode: "wal", schemaVersion: "001" }, process: { startedAt: meta.from, uptimeMs: 0, droppedSinceStart: 0 }, privateListener: { state: "available", bindAddress: "127.0.0.1:18081", publicProxy: false } }; }
function visitor(): VisitorData { return { generatedAt: meta.generatedAt, timezone: "Asia/Hong_Kong", visitor: { visitorId: "abcdefghijklmnopqrstuv", firstSeenAt: meta.from, lastSeenAt: meta.to, eventCount: 2, sessionCount: 1, commonLocale: "zh-Hant", commonDeviceType: "mobile", commonSourceType: "direct", eventComposition: [{ key: "route_query", count: 2, ratio: 1 }], commonPlatform: null }, sessions: [{ ordinal: 1, startedAt: meta.from, endedAt: meta.to, durationMs: 100, eventCount: 2, events: [] }], pageInfo: { limit: 50, nextCursor: null, hasMore: false, totalCount: 2 } }; }
