import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FilterProvider } from "../app/FilterProvider";
import { MonitoringI18nProvider } from "../app/MonitoringI18nProvider";
import { AnalyticsClientError } from "../services/analyticsClient";
import type { PerformanceData, SystemData } from "../services/analyticsTypes";
import { PerformancePage } from "./PerformancePage";

describe("PerformancePage", () => {
  it("renders six metrics, default P95 chart, SLI chart, failure distribution and endpoint table", async () => {
    renderPage(<PerformancePage loadPerformance={async () => performance()} loadSystem={async () => system()} />);
    expect((await screen.findAllByText("请求数")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("失败请求").length).toBeGreaterThan(0);
    expect(screen.getByText("启动后丢弃")).toBeInTheDocument();
    expect(screen.getAllByRole("list", { name: "图例" })[0]).toHaveTextContent("P95");
    expect(screen.getAllByRole("list", { name: "图例" })[1]).toHaveTextContent("主页访问");
    expect(screen.getByRole("table", { name: "公开接口性能" })).toBeInTheDocument();
    expect(screen.getByText("受控失败类别")).toBeInTheDocument();
  });

  it("keeps performance available when only system status fails", async () => {
    renderPage(<PerformancePage loadPerformance={async () => performance()} loadSystem={async () => { throw new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 500); }} />);
    expect((await screen.findAllByText("公开接口性能")).length).toBeGreaterThan(0);
    expect(screen.getByText("Dropped 暂不可用")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "统计查询暂时失败" })).not.toBeInTheDocument();
  });

  it("defaults latency to P95 and switches only the local chart to P50", async () => {
    renderPage(<PerformancePage loadPerformance={async () => performance()} loadSystem={async () => system()} />);
    expect(await screen.findByRole("button", { name: "P95" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "P50" }));
    expect(screen.getByRole("button", { name: "P50" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("list", { name: "图例" })[0]).toHaveTextContent("路线查询 P50");
    expect(screen.getAllByRole("list", { name: "图例" })[0]).not.toHaveTextContent("路线查询 P95");
  });
});

function renderPage(element: React.ReactElement) { return render(<MonitoringI18nProvider initialLocale="zh-Hans"><FilterProvider now={() => new Date("2026-07-21T00:00:00+08:00")}>{element}</FilterProvider></MonitoringI18nProvider>); }
const meta = { from: "2026-07-20T00:00:00+08:00", to: "2026-07-21T00:00:00+08:00", timezone: "Asia/Hong_Kong" as const, granularity: "day" as const, compare: false, comparisonFrom: null, comparisonTo: null, appliedFilters: { locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [], eventType: [] }, generatedAt: "2026-07-21T01:00:00Z", state: "ready" as const };
function performance(): PerformanceData { return { meta, metrics: [{ key: "requestCount", value: 12, previousValue: null, delta: null, deltaRate: null }, { key: "requestSuccessRate", value: .75, previousValue: null, delta: null, deltaRate: null }, { key: "p50Ms", value: 120, previousValue: null, delta: null, deltaRate: null }, { key: "p95Ms", value: 480, previousValue: null, delta: null, deltaRate: null }], endpoints: [{ operationId: "queryRouteOptions", eventType: "route_query", requestCount: 12, successRate: .75, p50Ms: 120, p50Comparison: { currentMs: 120, previousMs: null, deltaMs: null, deltaRate: null }, p95Ms: 480, p95Comparison: { currentMs: 480, previousMs: null, deltaMs: null, deltaRate: null } }], latencySeries: [{ bucketStart: meta.from, bucketEnd: meta.to, eventType: "route_query", requestCount: 12, p50Ms: 120, p95Ms: 480 }], sliSeries: ["page_view", "place_query", "route_query", "download_request"].map((eventType, index) => ({ bucketStart: meta.from, bucketEnd: meta.to, eventType: eventType as "page_view" | "place_query" | "route_query" | "download_request", successfulPV: index === 1 ? 0 : 1, totalPV: index === 3 ? 0 : 1, successRate: index === 1 ? 0 : index === 3 ? null : 1 })), failures: [{ key: "external_timeout", count: 3, ratio: 1 }] }; }
function system(): SystemData { return { generatedAt: meta.generatedAt, database: { state: "available", rowCount: 100, todayLocalDate: "2026-07-21", todayRowCount: 0, sizeBytes: 4096, lastSuccessfulWriteAt: meta.generatedAt }, sqlite: { version: "3.50.4", journalMode: "wal", schemaVersion: "001" }, process: { startedAt: meta.from, uptimeMs: 0, droppedSinceStart: 2 }, privateListener: { state: "available", bindAddress: "127.0.0.1:18081", publicProxy: false } }; }
