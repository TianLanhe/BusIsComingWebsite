import { useState } from "react";
import { DistributionChart } from "../components/charts/DistributionChart";
import { MetricCard } from "../components/charts/MetricCard";
import { TimeSeriesChart, type TimeSeriesDatum, type TimeSeriesDefinition } from "../components/charts/TimeSeriesChart";
import { DashboardShell } from "../components/layout/DashboardShell";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { monitoringCopy } from "../content/copy";
import { detailText, dimensionText, eventLabels } from "../content/types";
import { fetchPerformance, fetchSystem } from "../services/analyticsDetailsClient";
import type { AnalyticsQuery, EventType, Metric, PercentileComparison, PerformanceData, SystemData } from "../services/analyticsTypes";
import { deriveComparisonState } from "../model/comparisonState";
import { DetailState } from "./DetailState";
import { DetailHeading, dimensionLabels } from "./TrafficPage";
import { useAuxiliaryResource, useDetailResource } from "./useDetailResource";

const eventOrder: EventType[] = ["page_view", "place_query", "route_query", "download_request"];
const colors = ["#00545b", "#2799a8", "#d98a14", "#8b5cf6"];
type Percentile = "p50" | "p95";

export function PerformancePage({ loadPerformance = fetchPerformance, loadSystem = fetchSystem }: {
  loadPerformance?: (query: AnalyticsQuery, signal?: AbortSignal) => Promise<PerformanceData>;
  loadSystem?: (signal?: AbortSignal) => Promise<SystemData>;
}) {
  const { locale } = useMonitoringI18n();
  const [percentile, setPercentile] = useState<Percentile>("p95");
  const performance = useDetailResource(loadPerformance);
  const system = useAuxiliaryResource(loadSystem);
  const data = performance.data;
  const metrics = new Map(data?.metrics.map((item) => [item.key, item]));
  const failures = data?.failures.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const droppedMetric = system.data ? valueMetric("dropped", system.data.process.droppedSinceStart) : undefined;
  const latency = latencyChart(data, locale, percentile);
  const sli = sliChart(data, locale);

  return <DashboardShell active="performance" title="performance" subtitleText={detailText(locale, "performanceSubtitle")} generatedAt={data?.meta.generatedAt}>
    {performance.loading || performance.error || !data || data.meta.state !== "ready" ? <DetailState loading={performance.loading} error={performance.error} noData={!data || data.meta.state !== "ready"} locale={locale} /> : <>
      <section className="metric-grid performance-metrics">
        <MetricCard label={detailText(locale, "requests")} metric={metrics.get("requestCount")} locale={locale} compareEnabled={data.meta.compare} />
        <MetricCard label={detailText(locale, "requestSuccess")} metric={metrics.get("requestSuccessRate")} locale={locale} format="percent" compareEnabled={data.meta.compare} />
        <MetricCard label="P50" metric={metrics.get("p50Ms")} locale={locale} format="durationMs" presentation="lower_is_better" compareEnabled={data.meta.compare} />
        <MetricCard label="P95" metric={metrics.get("p95Ms")} locale={locale} format="durationMs" presentation="lower_is_better" compareEnabled={data.meta.compare} />
        <MetricCard label={detailText(locale, "failureRequests")} metric={valueMetric("failureRequests", failures)} locale={locale} compareEnabled={false} presentation="lower_is_better" />
        <MetricCard label={detailText(locale, "dropped")} metric={droppedMetric} locale={locale} compareEnabled={false} presentation="lower_is_better" />
      </section>
      {(system.error || (!system.loading && !system.data)) && <p className="partial-error" role="status">{detailText(locale, "droppedUnavailable")}</p>}
      <section className="detail-grid-2 performance-charts">
        <article className="dashboard-card chart-card performance-chart"><div className="chart-heading-row"><DetailHeading title={detailText(locale, "latencyTrend")} note={detailText(locale, "nearestRank")} /><div className="percentile-toggle" role="group" aria-label={detailText(locale, "latencyTrend")}>{(["p50", "p95"] as const).map((item) => <button key={item} type="button" aria-pressed={percentile === item} onClick={() => setPercentile(item)}>{item.toUpperCase()}</button>)}</div></div><TimeSeriesChart title={detailText(locale, "latencyTrend")} data={latency.chartData} series={latency.chartSeries} locale={locale} emptyLabel={monitoringCopy(locale, "chartEmpty")} /></article>
        <article className="dashboard-card chart-card performance-chart"><DetailHeading title={monitoringCopy(locale, "sli")} note={monitoringCopy(locale, "sliFormula")} /><TimeSeriesChart title={monitoringCopy(locale, "sli")} data={sli.chartData} series={sli.chartSeries} locale={locale} emptyLabel={monitoringCopy(locale, "chartEmpty")} /></article>
      </section>
      <section className="detail-grid-2 performance-lower"><article className="dashboard-card endpoint-panel"><DetailHeading title={detailText(locale, "endpointPerformance")} note="P50 / P95" /><div className="event-table-wrap"><table className="endpoint-table"><caption className="sr-only">{detailText(locale, "endpointPerformance")}</caption><thead><tr><th>Operation ID</th><th>{detailText(locale, "eventType")}</th><th>{detailText(locale, "requests")}</th><th>{detailText(locale, "requestSuccess")}</th><th>P50</th><th>P50 {monitoringCopy(locale, "compared")}</th><th>P95</th><th>P95 {monitoringCopy(locale, "compared")}</th></tr></thead><tbody>{data.endpoints.map((endpoint) => <tr key={endpoint.operationId}><td><code>{endpoint.operationId}</code></td><td>{eventLabels[endpoint.eventType][locale]}</td><td>{endpoint.requestCount}</td><td>{endpoint.successRate == null ? "—" : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(endpoint.successRate)}</td><td>{formatMS(endpoint.p50Ms, locale)}</td><td><PercentileCell value={endpoint.p50Ms} comparison={endpoint.p50Comparison} compare={data.meta.compare} locale={locale} /></td><td>{formatMS(endpoint.p95Ms, locale)}</td><td><PercentileCell value={endpoint.p95Ms} comparison={endpoint.p95Comparison} compare={data.meta.compare} locale={locale} /></td></tr>)}</tbody></table></div></article><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "controlledCategories")} note={detailText(locale, "failureRequests")} /><DistributionChart items={data.failures} locale={locale} labels={dimensionLabels(data.failures, locale)} /></article></section>
    </>}
  </DashboardShell>;
}

function PercentileCell({ value, comparison, compare, locale }: { value: number | null; comparison: PercentileComparison; compare: boolean; locale: "zh-Hans" | "zh-Hant" | "en" }) {
  const metric: Metric = { key: "latency", value, previousValue: comparison.previousMs, delta: comparison.deltaMs, deltaRate: comparison.deltaRate };
  const state = deriveComparisonState(metric, compare, "lower_is_better");
  if (state.viewState === "no_current") return <span>{monitoringCopy(locale, "latencyNoCurrent")}{comparison.previousMs != null && <small>{formatMS(comparison.previousMs, locale)}</small>}</span>;
  if (state.viewState === "disabled") return <span>{monitoringCopy(locale, "latencyComparisonOff")}</span>;
  if (state.viewState === "no_previous") return <span>{monitoringCopy(locale, "latencyNoPrevious")}</span>;
  if (state.viewState === "unchanged") return <span>{monitoringCopy(locale, "latencyUnchanged")}<small>0 ms</small></span>;
  if (state.viewState === "zero_baseline") return <span className="latency-comparison worse">{monitoringCopy(locale, "latencyZeroBaseline")}<small>+{comparison.deltaMs ?? 0} ms</small></span>;
  const arrow = state.direction === "up" ? "↑" : "↓";
  const delta = comparison.deltaMs == null ? "—" : `${comparison.deltaMs > 0 ? "+" : ""}${comparison.deltaMs} ms`;
  return <span className={`latency-comparison ${state.outcome}`}>{state.outcome === "better" ? monitoringCopy(locale, "latencyFaster") : monitoringCopy(locale, "latencySlower")}<small>{arrow} {delta}</small></span>;
}

function valueMetric(key: string, value: number | null): Metric { return { key, value, previousValue: null, delta: null, deltaRate: null }; }
function formatMS(value: number | null, locale: string) { return value == null ? "—" : `${new Intl.NumberFormat(locale).format(value)} ms`; }

function latencyChart(data: PerformanceData | null, locale: "zh-Hans" | "zh-Hant" | "en", percentile: Percentile) {
  if (!data) return { chartData: [] as TimeSeriesDatum[], chartSeries: [] as TimeSeriesDefinition[] };
  const buckets = new Map<string, TimeSeriesDatum>();
  for (const point of data.latencySeries) { const row = buckets.get(point.bucketStart) ?? { bucketStart: point.bucketStart }; row[point.eventType] = percentile === "p50" ? point.p50Ms : point.p95Ms; buckets.set(point.bucketStart, row); }
  return { chartData: [...buckets.values()], chartSeries: eventOrder.map((eventType, index) => ({ key: eventType, label: `${eventLabels[eventType][locale]} ${percentile.toUpperCase()}`, unit: "ms" as const, color: colors[index], lineStyle: "solid" as const, pointShape: "circle" as const })) };
}

function sliChart(data: PerformanceData | null, locale: "zh-Hans" | "zh-Hant" | "en") {
  if (!data) return { chartData: [] as TimeSeriesDatum[], chartSeries: [] as TimeSeriesDefinition[] };
  const buckets = new Map<string, TimeSeriesDatum>();
  for (const point of data.sliSeries) { const row = buckets.get(point.bucketStart) ?? { bucketStart: point.bucketStart }; row[point.eventType] = point.successRate; buckets.set(point.bucketStart, row); }
  return { chartData: [...buckets.values()], chartSeries: eventOrder.map((eventType, index) => ({ key: eventType, label: eventLabels[eventType][locale], unit: "percent" as const, color: colors[index], lineStyle: "solid" as const, pointShape: "circle" as const })) };
}
