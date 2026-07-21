import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAnalyticsFilters } from "../app/FilterProvider";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { DashboardShell } from "../components/layout/DashboardShell";
import { QueryState } from "../components/states/QueryState";
import { EventTable } from "../components/tables/EventTable";
import { ResponsiveEventList } from "../components/tables/ResponsiveEventList";
import { monitoringCopy } from "../content/copy";
import { detailText } from "../content/types";
import { AnalyticsClientError } from "../services/analyticsClient";
import { fetchEvents } from "../services/analyticsDetailsClient";
import type { AnalyticsQuery, EventListData } from "../services/analyticsTypes";

export function EventsPage({ loadEvents = fetchEvents }: { loadEvents?: (query: AnalyticsQuery, visitorID?: string, signal?: AbortSignal) => Promise<EventListData> }) {
  const filters = useAnalyticsFilters();
  const { locale } = useMonitoringI18n();
  const [data, setData] = useState<EventListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AnalyticsClientError | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [history, setHistory] = useState<(string | undefined)[]>([]);
  useEffect(() => {
    const controller = new AbortController(); let active = true; setLoading(true);
    void loadEvents({ ...filters.query, compare: false, limit: 50, cursor }, undefined, controller.signal).then((result) => { if (active) { setData(result); setError(null); setLoading(false); } }).catch((caught) => { if (active && !(caught instanceof DOMException && caught.name === "AbortError")) { setError(caught instanceof AnalyticsClientError ? caught : new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 0)); setLoading(false); } });
    return () => { active = false; controller.abort(); };
  }, [cursor, filters.query, filters.refreshVersion, loadEvents]);
  const viewVisitor = (visitorID: string) => { window.history.pushState({ ...(window.history.state ?? {}), analyticsVisitorId: visitorID }, "", "#visitor"); window.dispatchEvent(new HashChangeEvent("hashchange")); };
  const next = () => { if (data?.pageInfo.nextCursor) { setHistory((items) => [...items, cursor]); setCursor(data.pageInfo.nextCursor); } };
  const previous = () => { setHistory((items) => { const copy = [...items]; setCursor(copy.pop()); return copy; }); };
  return <DashboardShell active="events" title="events" subtitleText={detailText(locale, "eventsSubtitle")} generatedAt={data?.meta.generatedAt}>
    {loading ? <QueryState kind="loading" title={monitoringCopy(locale, "loadingTitle")} body={monitoringCopy(locale, "loadingBody")} /> : error ? <QueryState kind={error.code === "ANALYTICS_STORAGE_UNAVAILABLE" ? "storage_unavailable" : "query_failed"} title={monitoringCopy(locale, error.code === "ANALYTICS_STORAGE_UNAVAILABLE" ? "storageUnavailableTitle" : "queryFailedTitle")} body={monitoringCopy(locale, "queryFailedBody")} /> : data && <>
      <div className="privacy-note-detail"><ShieldCheck size={18} /><span>{detailText(locale, "privacyDetail")}</span><b>{detailText(locale, "pageSummary").replace("{count}", new Intl.NumberFormat(locale).format(data.pageInfo.totalCount))}</b></div>
      {data.items.length === 0 ? <QueryState kind="no_results" title={detailText(locale, "noDetailData")} body={detailText(locale, "noDetailBody")} /> : <><EventTable items={data.items} locale={locale} onViewVisitor={viewVisitor} /><ResponsiveEventList items={data.items} locale={locale} onViewVisitor={viewVisitor} /><div className="detail-pagination"><button type="button" disabled={history.length === 0} onClick={previous}><ChevronLeft />{detailText(locale, "previousPage")}</button><span>{data.items.length} / {data.pageInfo.totalCount}</span><button type="button" disabled={!data.pageInfo.hasMore} onClick={next}>{detailText(locale, "nextPage")}<ChevronRight /></button></div></>}
    </>}
  </DashboardShell>;
}
