import { DistributionChart } from "../components/charts/DistributionChart";
import { MetricCard } from "../components/charts/MetricCard";
import { TimeSeriesChart, type TimeSeriesDatum, type TimeSeriesDefinition } from "../components/charts/TimeSeriesChart";
import { DashboardShell } from "../components/layout/DashboardShell";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { monitoringCopy } from "../content/copy";
import { detailText, dimensionText, eventLabels } from "../content/types";
import { fetchPerformance, fetchSystem } from "../services/analyticsDetailsClient";
import type { AnalyticsQuery, EventType, Metric, PerformanceData, SystemData } from "../services/analyticsTypes";
import { DetailState } from "./DetailState";
import { DetailHeading, dimensionLabels } from "./TrafficPage";
import { useAuxiliaryResource, useDetailResource } from "./useDetailResource";

const eventOrder: EventType[] = ["page_view", "place_query", "route_query", "download_request"];
const colors = ["#00545b", "#2799a8", "#d98a14", "#8b5cf6"];

export function PerformancePage({ loadPerformance = fetchPerformance, loadSystem = fetchSystem }: {
  loadPerformance?: (query: AnalyticsQuery, signal?: AbortSignal) => Promise<PerformanceData>;
  loadSystem?: (signal?: AbortSignal) => Promise<SystemData>;
}) {
  const { locale } = useMonitoringI18n();
  // 两个资源分别发起请求；system 失败不会清空已经可用的 performance 主体。
  const performance = useDetailResource(loadPerformance);
  const system = useAuxiliaryResource(loadSystem);
  const data = performance.data;
  const metrics = new Map(data?.metrics.map((item) => [item.key, item]));
  const failures = data?.failures.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const droppedMetric = system.data ? valueMetric("dropped", system.data.process.droppedSinceStart) : undefined;
  const { chartData, chartSeries } = latencyChart(data, locale);

  return <DashboardShell active="performance" title="performance" subtitleText={detailText(locale, "performanceSubtitle")} generatedAt={data?.meta.generatedAt}>
    {performance.loading || performance.error || !data || data.meta.state !== "ready" ? <DetailState loading={performance.loading} error={performance.error} noData={!data || data.meta.state !== "ready"} locale={locale} /> : <>
      <section className="metric-grid performance-metrics">
        <MetricCard label={detailText(locale, "requests")} metric={metrics.get("requestCount")} locale={locale} compareEnabled={data.meta.compare} />
        <MetricCard label={detailText(locale, "requestSuccess")} metric={metrics.get("requestSuccessRate")} locale={locale} format="percent" compareEnabled={data.meta.compare} />
        <MetricCard label="P50" metric={metrics.get("p50Ms")} locale={locale} compareEnabled={data.meta.compare} />
        <MetricCard label="P95" metric={metrics.get("p95Ms")} locale={locale} compareEnabled={data.meta.compare} />
        <MetricCard label={detailText(locale, "failureRequests")} metric={valueMetric("failureRequests", failures)} locale={locale} compareEnabled={false} />
        <MetricCard label={detailText(locale, "dropped")} metric={droppedMetric} locale={locale} compareEnabled={false} />
      </section>
      {(system.error || (!system.loading && !system.data)) && <p className="partial-error" role="status">{detailText(locale, "droppedUnavailable")}</p>}
      <section className="dashboard-card chart-card performance-chart"><DetailHeading title={detailText(locale, "latencyTrend")} note={detailText(locale, "nearestRank")} /><TimeSeriesChart title={detailText(locale, "latencyTrend")} data={chartData} series={chartSeries} locale={locale} emptyLabel={monitoringCopy(locale, "chartEmpty")} /></section>
      <section className="detail-grid-2 performance-lower"><article className="dashboard-card endpoint-panel"><DetailHeading title={detailText(locale, "endpointPerformance")} note="P50 / P95" /><div className="event-table-wrap"><table className="endpoint-table"><caption className="sr-only">{detailText(locale, "endpointPerformance")}</caption><thead><tr><th>Operation ID</th><th>{detailText(locale, "eventType")}</th><th>{detailText(locale, "requests")}</th><th>{detailText(locale, "requestSuccess")}</th><th>P50</th><th>P95</th></tr></thead><tbody>{data.endpoints.map((endpoint) => <tr key={endpoint.operationId}><td><code>{endpoint.operationId}</code></td><td>{eventLabels[endpoint.eventType][locale]}</td><td>{endpoint.requestCount}</td><td>{endpoint.successRate == null ? "—" : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(endpoint.successRate)}</td><td>{formatMS(endpoint.p50Ms, locale)}</td><td>{formatMS(endpoint.p95Ms, locale)}</td></tr>)}</tbody></table></div></article><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "controlledCategories")} note={detailText(locale, "failureRequests")} /><DistributionChart items={data.failures} locale={locale} labels={dimensionLabels(data.failures, locale)} /></article></section>
    </>}
  </DashboardShell>;
}

function valueMetric(key: string, value: number): Metric { return { key, value, previousValue: null, delta: null, deltaRate: null }; }
function formatMS(value: number | null, locale: string) { return value == null ? "—" : `${new Intl.NumberFormat(locale).format(value)} ms`; }

function latencyChart(data: PerformanceData | null, locale: "zh-Hans" | "zh-Hant" | "en") {
  if (!data) return { chartData: [] as TimeSeriesDatum[], chartSeries: [] as TimeSeriesDefinition[] };
  const buckets = new Map<string, TimeSeriesDatum>();
  for (const point of data.latencySeries) {
    const row = buckets.get(point.bucketStart) ?? { bucketStart: point.bucketStart };
    row[`${point.eventType}_p50`] = point.p50Ms;
    row[`${point.eventType}_p95`] = point.p95Ms;
    buckets.set(point.bucketStart, row);
  }
  const present = eventOrder.filter((eventType) => data.latencySeries.some((point) => point.eventType === eventType));
  const chartSeries = present.flatMap((eventType) => {
    const index = eventOrder.indexOf(eventType);
    const label = eventLabels[eventType][locale];
    return [
      { key: `${eventType}_p50`, label: `${label} P50`, unit: "ms" as const, color: colors[index], lineStyle: "solid" as const, pointShape: "circle" as const },
      { key: `${eventType}_p95`, label: `${label} P95`, unit: "ms" as const, color: colors[index], lineStyle: "dashed" as const, pointShape: "diamond" as const },
    ];
  });
  return { chartData: [...buckets.values()], chartSeries };
}
