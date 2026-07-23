import { DistributionChart } from "../components/charts/DistributionChart";
import { FunnelChart } from "../components/charts/FunnelChart";
import { Heatmap } from "../components/charts/Heatmap";
import { MetricCard } from "../components/charts/MetricCard";
import { TrafficChart } from "../components/charts/TrafficChart";
import { DashboardShell } from "../components/layout/DashboardShell";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { monitoringCopy } from "../content/copy";
import { detailText, dimensionText } from "../content/types";
import { fetchTraffic } from "../services/analyticsDetailsClient";
import type { AnalyticsQuery, TrafficData } from "../services/analyticsTypes";
import { DetailState } from "./DetailState";
import { useDetailResource } from "./useDetailResource";

export function TrafficPage({ loadTraffic = fetchTraffic }: { loadTraffic?: (query: AnalyticsQuery, signal?: AbortSignal) => Promise<TrafficData> }) {
  const { locale } = useMonitoringI18n();
  const { data, error, loading } = useDetailResource(loadTraffic);
  const metrics = new Map(data?.metrics.map((metric) => [metric.key, metric]));
  const state = <DetailState loading={loading} error={error} noData={!data || data.meta.state !== "ready"} locale={locale} />;
  return <DashboardShell active="traffic" title="traffic" subtitleText={detailText(locale, "trafficSubtitle")} generatedAt={data?.meta.generatedAt}>
    {loading || error || !data || data.meta.state !== "ready" ? state : <>
      <section className="metric-grid detail-metrics"><MetricCard label={monitoringCopy(locale, "homepagePv")} metric={metrics.get("pv")} locale={locale} compareEnabled={data.meta.compare} /><MetricCard label={monitoringCopy(locale, "homepageUv")} metric={metrics.get("uv")} locale={locale} compareEnabled={data.meta.compare} /><MetricCard label={monitoringCopy(locale, "placeQueryPv")} metric={metrics.get("placeQueryRequests")} locale={locale} compareEnabled={data.meta.compare} /><MetricCard label={monitoringCopy(locale, "placeQueryUv")} metric={metrics.get("placeQueryVisitors")} locale={locale} compareEnabled={data.meta.compare} /><MetricCard label={monitoringCopy(locale, "routeQueryPv")} metric={metrics.get("routeQueryRequests")} locale={locale} compareEnabled={data.meta.compare} /><MetricCard label={monitoringCopy(locale, "routeQueryUv")} metric={metrics.get("routeQueryVisitors")} locale={locale} compareEnabled={data.meta.compare} /></section>
      <p className="metric-definition-note">{monitoringCopy(locale, "anonymousUvNote")}</p>
      <section className="overview-primary-grid"><article className="dashboard-card chart-card"><DetailHeading title={detailText(locale, "trafficTrend")} note={monitoringCopy(locale, "anonymousUvNote")} /><TrafficChart data={data.series} locale={locale} summary={detailText(locale, "trafficTrend")} emptyLabel={monitoringCopy(locale, "chartEmpty")} /></article><article className="dashboard-card chart-card"><DetailHeading title={monitoringCopy(locale, "trialFunnel")} note={monitoringCopy(locale, "trialNote")} /><FunnelChart funnel={data.trialFunnel} locale={locale} labels={{ homepage: monitoringCopy(locale, "homepage"), successful_place_query: monitoringCopy(locale, "placeQuery"), successful_route_query: monitoringCopy(locale, "routeQuery") }} /></article></section>
      <section className="detail-grid-2"><article className="dashboard-card heatmap-card"><DetailHeading title={detailText(locale, "heatmap")} note={detailText(locale, "heatmapNote")} /><Heatmap cells={data.heatmap} locale={locale} label={detailText(locale, "heatmap")} /></article><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "dimensions")} note="UV" /><div className="dimension-columns"><DistributionChart items={data.locales} locale={locale} labels={dimensionLabels(data.locales, locale)} /><DistributionChart items={data.devices} locale={locale} labels={dimensionLabels(data.devices, locale)} /><DistributionChart items={data.sources} locale={locale} labels={dimensionLabels(data.sources, locale)} /></div></article></section>
    </>}
  </DashboardShell>;
}

export function DetailHeading({ title, note, meta = "" }: { title: string; note: string; meta?: string }) { return <div className="card-heading"><div><h2>{title}</h2><p>{note}</p></div><span>{meta}</span></div>; }

export function dimensionLabels(items: Array<{ key: string }>, locale: Parameters<typeof dimensionText>[0]) { return Object.fromEntries(items.map((item) => [item.key, dimensionText(locale, item.key)])); }
