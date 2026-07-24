import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAnalyticsFilters } from "../app/FilterProvider";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { DashboardShell } from "../components/layout/DashboardShell";
import { MetricCard } from "../components/charts/MetricCard";
import { QueryState } from "../components/states/QueryState";
import { EventTable } from "../components/tables/EventTable";
import { ResponsiveEventList } from "../components/tables/ResponsiveEventList";
import { monitoringCopy } from "../content/copy";
import { detailText } from "../content/types";
import { AnalyticsClientError } from "../services/analyticsClient";
import { fetchEvents } from "../services/analyticsDetailsClient";
import type { AnalyticsQuery, EventListData } from "../services/analyticsTypes";

const pageSize = 50;

export function EventsPage({ loadEvents = fetchEvents }: { loadEvents?: (query: AnalyticsQuery, visitorID?: string, signal?: AbortSignal) => Promise<EventListData> }) {
  const filters = useAnalyticsFilters();
  const { locale } = useMonitoringI18n();
  const [data, setData] = useState<EventListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AnalyticsClientError | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [history, setHistory] = useState<(string | undefined)[]>([]);
  const [retryVersion, setRetryVersion] = useState(0);
  const filterKey = useMemo(() => JSON.stringify(filters.query), [filters.query]);

  useEffect(() => {
    setCursor(undefined);
    setHistory([]);
  }, [filterKey]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    void loadEvents({ ...filters.query, limit: pageSize, cursor }, undefined, controller.signal)
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
          setLoading(false);
        }
      })
      .catch((caught) => {
        if (active && !(caught instanceof DOMException && caught.name === "AbortError")) {
          setError(caught instanceof AnalyticsClientError ? caught : new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 0));
          setLoading(false);
        }
      });
    return () => { active = false; controller.abort(); };
  }, [cursor, filterKey, filters.query, filters.refreshVersion, loadEvents, retryVersion]);

  const viewVisitor = (visitorID: string) => {
    window.history.pushState({ ...(window.history.state ?? {}), analyticsVisitorId: visitorID }, "", "#visitor");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  const next = () => {
    if (data?.pageInfo.nextCursor) {
      setHistory((items) => [...items, cursor]);
      setCursor(data.pageInfo.nextCursor);
    }
  };
  const previous = () => {
    setHistory((items) => {
      const copy = [...items];
      setCursor(copy.pop());
      return copy;
    });
  };

  const page = history.length + 1;
  const start = data && data.items.length > 0 ? history.length * pageSize + 1 : 0;
  const end = data ? start + data.items.length - (data.items.length > 0 ? 1 : 0) : 0;
  return <DashboardShell active="events" title="events" subtitleText={detailText(locale, "eventsSubtitle")} generatedAt={data?.meta.generatedAt}>
    {loading ? <QueryState kind="loading" title={monitoringCopy(locale, "loadingTitle")} body={monitoringCopy(locale, "loadingBody")} /> : error ? <QueryState kind={error.code === "ANALYTICS_STORAGE_UNAVAILABLE" ? "storage_unavailable" : "query_failed"} title={monitoringCopy(locale, error.code === "ANALYTICS_STORAGE_UNAVAILABLE" ? "storageUnavailableTitle" : "queryFailedTitle")} body={monitoringCopy(locale, "queryFailedBody")} retryLabel={monitoringCopy(locale, "retry")} onRetry={() => setRetryVersion((value) => value + 1)} /> : data && <>
      <section className="event-summary-grid" aria-label={detailText(locale, "pageSummary").replace("{count}", String(data.summary.totalCount))}>
        <MetricCard label={detailText(locale, "eventSummaryTotal")} metric={data.summaryMetrics.find((metric) => metric.key === "totalCount")} locale={locale} compareEnabled={data.meta.compare} />
        <MetricCard label={detailText(locale, "eventSummarySuccess")} metric={data.summaryMetrics.find((metric) => metric.key === "successCount")} locale={locale} compareEnabled={data.meta.compare} />
        <MetricCard label={detailText(locale, "eventSummaryFailure")} metric={data.summaryMetrics.find((metric) => metric.key === "failureCount")} locale={locale} compareEnabled={data.meta.compare} presentation="lower_is_better" />
        <MetricCard label={detailText(locale, "eventSummaryVisitors")} metric={data.summaryMetrics.find((metric) => metric.key === "uniqueVisitors")} locale={locale} compareEnabled={data.meta.compare} />
      </section>
      <div className="privacy-note-detail"><ShieldCheck size={20} /><span>{detailText(locale, "privacyDetail")}</span></div>
      {data.items.length === 0 ? <QueryState kind="no_results" title={detailText(locale, "noDetailData")} body={detailText(locale, "noDetailBody")} /> : <section className="event-results dashboard-card">
        <div className="event-results-head"><b>{detailText(locale, "itemRange").replace("{start}", String(start)).replace("{end}", String(end)).replace("{total}", new Intl.NumberFormat(locale).format(data.pageInfo.totalCount))}</b><span>{detailText(locale, "pagePosition").replace("{page}", String(page))}</span></div>
        <EventTable items={data.items} locale={locale} onViewVisitor={viewVisitor} />
        <ResponsiveEventList items={data.items} locale={locale} onViewVisitor={viewVisitor} />
        <div className="detail-pagination"><button type="button" disabled={history.length === 0} onClick={previous}><ChevronLeft />{detailText(locale, "previousPage")}</button><span>{detailText(locale, "pagePosition").replace("{page}", String(page))}</span><button type="button" disabled={!data.pageInfo.hasMore} onClick={next}>{detailText(locale, "nextPage")}<ChevronRight /></button></div>
      </section>}
    </>}
  </DashboardShell>;
}
