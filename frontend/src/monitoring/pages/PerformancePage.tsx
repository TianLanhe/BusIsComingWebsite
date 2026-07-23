import { DistributionChart } from "../components/charts/DistributionChart";
import { MetricCard } from "../components/charts/MetricCard";
import { DashboardShell } from "../components/layout/DashboardShell";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { detailText, eventLabels } from "../content/types";
import { fetchPerformance } from "../services/analyticsDetailsClient";
import type { AnalyticsQuery, PerformanceData } from "../services/analyticsTypes";
import { DetailState } from "./DetailState";
import { DetailHeading, dimensionLabels } from "./TrafficPage";
import { useDetailResource } from "./useDetailResource";

export function PerformancePage({ loadPerformance = fetchPerformance }: { loadPerformance?: (query: AnalyticsQuery, signal?: AbortSignal) => Promise<PerformanceData> }) {
  const { locale } = useMonitoringI18n(); const { data, error, loading } = useDetailResource(loadPerformance); const metrics = new Map(data?.metrics.map((item) => [item.key, item]));
  return <DashboardShell active="performance" title="performance" subtitleText={detailText(locale, "performanceSubtitle")} generatedAt={data?.meta.generatedAt}>{loading || error || !data || data.meta.state !== "ready" ? <DetailState loading={loading} error={error} noData={!data || data.meta.state !== "ready"} locale={locale} /> : <>
    <section className="metric-grid detail-metrics"><MetricCard label={detailText(locale, "requests")} metric={metrics.get("requestCount")} locale={locale} /><MetricCard label={detailText(locale, "requestSuccess")} metric={metrics.get("requestSuccessRate")} locale={locale} format="percent" /><MetricCard label="P50" metric={metrics.get("p50Ms")} locale={locale} /><MetricCard label="P95" metric={metrics.get("p95Ms")} locale={locale} /></section>
    <section className="dashboard-card endpoint-panel"><DetailHeading title={detailText(locale, "endpointPerformance")} note="P50 / P95" /><div className="endpoint-grid">{data.endpoints.map((endpoint) => <article key={endpoint.operationId}><code>{endpoint.operationId}</code><b>{eventLabels[endpoint.eventType][locale]}</b><dl><dt>{detailText(locale, "requests")}</dt><dd>{endpoint.requestCount}</dd><dt>{detailText(locale, "requestSuccess")}</dt><dd>{endpoint.successRate == null ? "—" : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(endpoint.successRate)}</dd><dt>P95</dt><dd>{endpoint.p95Ms ?? "—"}ms</dd></dl></article>)}</div></section>
    <section className="detail-grid-2"><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "latencyTrend")} note={detailText(locale, "nearestRank")} /><div className="latency-bars">{data.endpoints.map((endpoint) => <div key={endpoint.operationId}><span>{eventLabels[endpoint.eventType][locale]}</span><i aria-hidden="true" style={{ width: `${Math.min(100, (endpoint.p95Ms ?? 0) / Math.max(1, ...data.endpoints.map((item) => item.p95Ms ?? 0)) * 100)}%` }} /><b>{endpoint.p95Ms ?? "—"}ms</b></div>)}</div></article><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "failures")} note={detailText(locale, "controlledCategories")} /><DistributionChart items={data.failures} locale={locale} labels={dimensionLabels(data.failures, locale)} /></article></section>
  </>}</DashboardShell>;
}
