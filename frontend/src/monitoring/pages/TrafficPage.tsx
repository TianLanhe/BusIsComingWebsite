import { DistributionChart } from "../components/charts/DistributionChart";
import { FunnelChart } from "../components/charts/FunnelChart";
import { Heatmap } from "../components/charts/Heatmap";
import { MetricCard } from "../components/charts/MetricCard";
import { TrafficChart } from "../components/charts/TrafficChart";
import { DashboardShell } from "../components/layout/DashboardShell";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { monitoringCopy } from "../content/copy";
import { detailText } from "../content/types";
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
      <section className="metric-grid detail-metrics"><MetricCard label={monitoringCopy(locale, "pv")} metric={metrics.get("pv")} locale={locale} /><MetricCard label={monitoringCopy(locale, "uv")} metric={metrics.get("uv")} locale={locale} /><MetricCard label={monitoringCopy(locale, "placeQuery")} metric={metrics.get("successfulPlaceVisitors")} locale={locale} /><MetricCard label={monitoringCopy(locale, "routeQuery")} metric={metrics.get("successfulRouteVisitors")} locale={locale} /></section>
      <section className="overview-primary-grid"><article className="dashboard-card chart-card"><DetailHeading title={detailText(locale, "trafficTrend")} note="PV / UV / route UV" /><TrafficChart data={data.series} locale={locale} summary={detailText(locale, "trafficTrend")} /></article><article className="dashboard-card chart-card"><DetailHeading title={monitoringCopy(locale, "trialFunnel")} note={monitoringCopy(locale, "trialNote")} /><FunnelChart funnel={data.trialFunnel} locale={locale} labels={{ homepage: monitoringCopy(locale, "homepage"), successful_place_query: monitoringCopy(locale, "placeQuery"), successful_route_query: monitoringCopy(locale, "routeQuery") }} /></article></section>
      <section className="detail-grid-2"><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "heatmap")} note={detailText(locale, "heatmapNote")} /><Heatmap cells={data.heatmap} locale={locale} label={detailText(locale, "heatmap")} /></article><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "dimensions")} note="UV" /><div className="dimension-columns"><DistributionChart items={data.locales} locale={locale} /><DistributionChart items={data.devices} locale={locale} /><DistributionChart items={data.sources} locale={locale} /></div></article></section>
    </>}
  </DashboardShell>;
}

export function DetailHeading({ title, note, meta = "" }: { title: string; note: string; meta?: string }) { return <div className="card-heading"><div><h2>{title}</h2><p>{note}</p></div><span>{meta}</span></div>; }
