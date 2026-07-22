import { DistributionChart } from "../components/charts/DistributionChart";
import { FunnelChart } from "../components/charts/FunnelChart";
import { MetricCard } from "../components/charts/MetricCard";
import { TimeSeriesChart, type TimeSeriesDefinition } from "../components/charts/TimeSeriesChart";
import { DashboardShell } from "../components/layout/DashboardShell";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { monitoringCopy } from "../content/copy";
import { detailText } from "../content/types";
import { fetchDownloads } from "../services/analyticsDetailsClient";
import type { AnalyticsQuery, DownloadsData } from "../services/analyticsTypes";
import { DetailState } from "./DetailState";
import { DetailHeading, dimensionLabels } from "./TrafficPage";
import { useDetailResource } from "./useDetailResource";

export function DownloadsPage({ loadDownloads = fetchDownloads }: { loadDownloads?: (query: AnalyticsQuery, signal?: AbortSignal) => Promise<DownloadsData> }) {
  const { locale } = useMonitoringI18n();
  const { data, error, loading } = useDetailResource(loadDownloads);
  const metrics = new Map(data?.metrics.map((metric) => [metric.key, metric]));
  const series = data?.series.map((point) => ({ bucketStart: point.bucketStart, requests: point.requests, successfulResponses: point.successfulResponses, uv: point.uv })) ?? [];
  const seriesDefinitions: TimeSeriesDefinition[] = [
    { key: "requests", label: monitoringCopy(locale, "downloadRequests"), unit: "count", color: "#00545b", lineStyle: "solid", pointShape: "circle" },
    { key: "successfulResponses", label: monitoringCopy(locale, "successfulDownload"), unit: "count", color: "#168a62", lineStyle: "solid", pointShape: "square" },
    { key: "uv", label: monitoringCopy(locale, "downloadUV"), unit: "count", color: "#8b5cf6", lineStyle: "dashed", pointShape: "diamond" },
  ];
  return <DashboardShell active="downloads" title="downloads" subtitleText={detailText(locale, "downloadsSubtitle")} generatedAt={data?.meta.generatedAt}>
    {loading || error || !data || data.meta.state !== "ready" ? <DetailState loading={loading} error={error} noData={!data || data.meta.state !== "ready"} locale={locale} /> : <>
      <section className="metric-grid detail-metrics"><MetricCard label={monitoringCopy(locale, "downloadRequests")} metric={metrics.get("downloadRequests")} locale={locale} compareEnabled={data.meta.compare} /><MetricCard label={monitoringCopy(locale, "successfulDownload")} metric={metrics.get("successfulDownloadResponses")} locale={locale} compareEnabled={data.meta.compare} /><MetricCard label={monitoringCopy(locale, "downloadUV")} metric={metrics.get("downloadUV")} locale={locale} compareEnabled={data.meta.compare} /><MetricCard label={monitoringCopy(locale, "requestSuccessRate")} metric={metrics.get("downloadSuccessRate")} locale={locale} format="percent" compareEnabled={data.meta.compare} /></section>
      <section className="overview-primary-grid"><article className="dashboard-card chart-card"><DetailHeading title={detailText(locale, "downloadTrend")} note={monitoringCopy(locale, "downloadNote")} /><TimeSeriesChart title={detailText(locale, "downloadTrend")} data={series} series={seriesDefinitions} locale={locale} emptyLabel={monitoringCopy(locale, "chartEmpty")} /></article><article className="dashboard-card chart-card"><DetailHeading title={monitoringCopy(locale, "downloadSummary")} note={monitoringCopy(locale, "downloadNote")} /><FunnelChart funnel={data.downloadFunnel} locale={locale} labels={{ homepage: monitoringCopy(locale, "homepage"), successful_download_response: monitoringCopy(locale, "successfulDownload") }} /></article></section>
      <section className="detail-grid-3"><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "platforms")} note={detailText(locale, "requests")} /><DistributionChart items={data.platforms} locale={locale} labels={dimensionLabels(data.platforms, locale)} /></article><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "versions")} note="Android / iOS" /><div className="version-table">{data.versions.map((version) => <div key={`${version.platform}-${version.versionCode}`}><span>{version.platform}</span><b>v{version.versionName} ({version.versionCode})</b><em>{version.successfulResponses}/{version.requestCount}</em></div>)}</div></article><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "failures")} note={detailText(locale, "controlledCategories")} /><DistributionChart items={data.failures} locale={locale} labels={dimensionLabels(data.failures, locale)} /></article></section>
    </>}
  </DashboardShell>;
}
