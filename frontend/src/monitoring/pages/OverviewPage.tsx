import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Download, TimerReset } from "lucide-react";
import { useAnalyticsFilters } from "../app/FilterProvider";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { DistributionChart } from "../components/charts/DistributionChart";
import { FunnelChart } from "../components/charts/FunnelChart";
import { MetricCard } from "../components/charts/MetricCard";
import { TrafficChart } from "../components/charts/TrafficChart";
import { DashboardShell } from "../components/layout/DashboardShell";
import { QueryState } from "../components/states/QueryState";
import { monitoringCopy, type CopyKey } from "../content/copy";
import { eventLabels } from "../content/types";
import { AnalyticsClientError, fetchOverview } from "../services/analyticsClient";
import type { AnalyticsQuery, Metric, OverviewData } from "../services/analyticsTypes";

type OverviewLoader = (query: AnalyticsQuery, signal?: AbortSignal) => Promise<OverviewData>;

export function OverviewPage({ loadOverview = fetchOverview }: { loadOverview?: OverviewLoader }) {
  const filters = useAnalyticsFilters();
  const { locale } = useMonitoringI18n();
  const t = (key: CopyKey) => monitoringCopy(locale, key);
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<AnalyticsClientError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const run = async () => {
      if (!active) return;
      if (!data) setLoading(true); else setRefreshing(true);
      try {
        const result = await loadOverview(filters.query, controller.signal);
        if (!active) return;
        setData(result);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        // 只在成功完成后推进全局时钟；Provider 会重新计算包含今天的查询上界。
        timer.current = window.setTimeout(filters.refresh, 60_000);
      } catch (caught) {
        if (!active || (caught instanceof DOMException && caught.name === "AbortError")) return;
        setError(caught instanceof AnalyticsClientError ? caught : new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 0));
        setLoading(false);
        setRefreshing(false);
      }
    };
    void run();
    return () => {
      active = false;
      controller.abort();
      if (timer.current != null) window.clearTimeout(timer.current);
    };
    // A manual refresh or a filter change starts a fresh, non-overlapping cycle.
  }, [filters.query, filters.refreshVersion, retryVersion, loadOverview]);

  const metrics = useMemo(() => new Map((data?.metrics ?? []).map((metric) => [metric.key, metric])), [data]);
  const state = resolvePageState(loading, error, data);
  return <DashboardShell generatedAt={data?.meta.generatedAt} refreshing={refreshing}>
    {state !== "ready" ? <QueryState
      kind={state}
      title={t(stateTitle[state])}
      body={t(stateBody[state])}
      retryLabel={t("retry")}
      onRetry={state === "query_failed" || state === "storage_unavailable" ? () => setRetryVersion((value) => value + 1) : undefined}
    /> : <>
      <section className="metric-grid" data-testid="metric-grid">
        <MetricCard label={t("pv")} metric={metrics.get("pv")} locale={locale} compareEnabled={data!.meta.compare} />
        <MetricCard label={t("uv")} metric={metrics.get("uv")} locale={locale} compareEnabled={data!.meta.compare} />
        <MetricCard label={t("viewsPerVisitor")} metric={metrics.get("viewsPerVisitor")} locale={locale} format="decimal" compareEnabled={data!.meta.compare} />
        <MetricCard label={t("successfulRouteQueries")} metric={metrics.get("successfulRouteQueries")} locale={locale} compareEnabled={data!.meta.compare} />
        <MetricCard label={t("downloadRequests")} metric={metrics.get("downloadRequests")} locale={locale} compareEnabled={data!.meta.compare} />
        <MetricCard label={t("requestSuccessRate")} metric={metrics.get("requestSuccessRate")} locale={locale} format="percent" compareEnabled={data!.meta.compare} />
      </section>
      <section className="overview-primary-grid">
        <article className="dashboard-card chart-card trend-card">
          <CardHeading title={t("trend")} note={t("trendNote")} meta={t("hoverDetail")} />
          <TrafficChart data={data!.trafficSeries} locale={locale} summary={t("chartSummary")} emptyLabel={t("chartEmpty")} />
        </article>
        <article className="dashboard-card chart-card">
          <CardHeading title={t("trialFunnel")} note={t("trialNote")} meta="UV" />
          <FunnelChart funnel={data!.trialFunnel} locale={locale} labels={funnelLabels(t)} />
          <p className="funnel-caption">{funnelCaption(data!.trialFunnel, locale)}</p>
        </article>
      </section>
      <section className="overview-secondary-grid">
        <article className="dashboard-card compact-card">
          <CardHeading title={t("eventComposition")} note={t("eventNote")} meta={new Intl.NumberFormat(locale).format(data!.eventComposition.reduce((sum, item) => sum + item.count, 0))} />
          <DistributionChart items={data!.eventComposition} locale={locale} labels={{ page_view: t("homepage"), place_query: t("placeQuery"), route_query: t("routeQuery"), download_request: t("downloadRequests") }} />
        </article>
        <article className="dashboard-card compact-card latency-card">
          <CardHeading title={t("latencyP95")} note={t("latencyNote")} meta={t("success")} />
          <div className="latency-event-list">
            {data!.latencyByEvent.map((item) => <div key={item.eventType}>
              <span><TimerReset aria-hidden="true" />{latencyEventLabel(item.eventType, locale, t)}</span>
              <b>{item.p95Ms == null ? t("noSuccessfulSamples") : formatDuration(item.p95Ms)}</b>
              <small>{t("requestCount")} {new Intl.NumberFormat(locale).format(item.requestCount)}</small>
            </div>)}
          </div>
        </article>
        <article className="dashboard-card compact-card download-card-monitor">
          <CardHeading title={t("downloadSummary")} note={t("downloadNote")} meta={data!.downloadPlatforms[0]?.key ?? "—"} />
          <div className="download-overview"><span><Activity />{t("homepage")}<b>{new Intl.NumberFormat(locale).format(data!.downloadFunnel.stages[0]?.uniqueVisitors ?? 0)}</b></span><span><Download />{t("downloadUV")}<b>{new Intl.NumberFormat(locale).format(data!.downloadFunnel.stages[1]?.uniqueVisitors ?? 0)}</b></span></div>
          {data!.downloadVersions[0] && <div className="version-row"><span>{t("currentVersion")}</span><b>v{data!.downloadVersions[0].versionName} ({data!.downloadVersions[0].versionCode})</b><em>{new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(data!.downloadVersions[0].successfulResponses / Math.max(1, data!.downloadVersions[0].requestCount))}</em></div>}
          <p className="annotation">{t("androidReserved")}</p>
        </article>
      </section>
    </>}
  </DashboardShell>;
}

function CardHeading({ title, note, meta }: { title: string; note: string; meta: string }) {
  return <div className="card-heading"><div><h2>{title}</h2><p>{note}</p></div><span>{meta}</span></div>;
}

type ResolvedState = "ready" | "loading" | "no_data" | "no_results" | "query_failed" | "storage_unavailable";
const stateTitle: Record<Exclude<ResolvedState, "ready">, CopyKey> = { loading: "loadingTitle", no_data: "noDataTitle", no_results: "noResultsTitle", query_failed: "queryFailedTitle", storage_unavailable: "storageUnavailableTitle" };
const stateBody: Record<Exclude<ResolvedState, "ready">, CopyKey> = { loading: "loadingBody", no_data: "noDataBody", no_results: "noResultsBody", query_failed: "queryFailedBody", storage_unavailable: "storageUnavailableBody" };

function resolvePageState(loading: boolean, error: AnalyticsClientError | null, data: OverviewData | null): ResolvedState {
  if (loading) return "loading";
  if (error?.code === "ANALYTICS_STORAGE_UNAVAILABLE") return "storage_unavailable";
  if (error) return "query_failed";
  if (data?.meta.state === "no_data") return "no_data";
  if (data?.meta.state === "no_results") return "no_results";
  return "ready";
}

function funnelLabels(t: (key: CopyKey) => string): Record<string, string> {
  return { homepage: t("homepage"), successful_place_query: t("placeQuery"), successful_route_query: t("routeQuery"), successful_download_response: t("successfulDownload") };
}

function funnelCaption(funnel: OverviewData["trialFunnel"], locale: string) {
  return funnel.stages.slice(1).map((stage, index) => `${index === 0 ? "主页 → 地点" : "地点 → 路线"} ${stage.fromPreviousRate == null ? "—" : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(stage.fromPreviousRate)}`).join(" · ");
}

function formatDuration(value: number | null) {
  if (value == null) return "—";
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value}ms`;
}

function latencyEventLabel(eventType: OverviewData["latencyByEvent"][number]["eventType"], locale: keyof typeof eventLabels["page_view"], t: (key: CopyKey) => string) {
  if (eventType === "page_view") return t("apkMetadata");
  if (eventType === "download_request") return t("downloadResponseLatency");
  return eventLabels[eventType][locale];
}
