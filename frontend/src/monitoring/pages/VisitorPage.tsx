import { Copy, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { DashboardShell } from "../components/layout/DashboardShell";
import { QueryState } from "../components/states/QueryState";
import { VisitorTimeline } from "../components/timeline/VisitorTimeline";
import { monitoringCopy } from "../content/copy";
import { detailText } from "../content/types";
import { AnalyticsClientError } from "../services/analyticsClient";
import { fetchVisitor } from "../services/analyticsDetailsClient";
import type { VisitorData } from "../services/analyticsTypes";
import { formatDate } from "../components/tables/EventTable";

export function VisitorPage({ initialVisitorID, loadVisitor = fetchVisitor }: { initialVisitorID?: string; loadVisitor?: (visitorID: string, limit: number, cursor?: string, signal?: AbortSignal) => Promise<VisitorData> }) {
  const { locale } = useMonitoringI18n();
  const historyVisitor = (window.history.state as { analyticsVisitorId?: string } | null)?.analyticsVisitorId;
  const [input, setInput] = useState(initialVisitorID ?? historyVisitor ?? "");
  const [visitorID, setVisitorID] = useState(initialVisitorID ?? historyVisitor ?? "");
  const [data, setData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(Boolean(visitorID));
  const [error, setError] = useState<AnalyticsClientError | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!visitorID) return;
    let active = true; setLoading(true); setCopied(false);
    void loadVisitor(visitorID, 50, undefined).then((result) => { if (active) { setData(result); setError(null); setLoading(false); } }).catch((caught) => { if (active) { setError(caught instanceof AnalyticsClientError ? caught : new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 0)); setLoading(false); } });
    return () => { active = false; };
  }, [loadVisitor, visitorID]);
  const submit = (event: FormEvent) => { event.preventDefault(); if (/^[A-Za-z0-9_-]{22}$/.test(input)) setVisitorID(input); };
  const copy = async () => { if (!data) return; try { await navigator.clipboard?.writeText(data.visitor.visitorId); } catch { /* private browser fallback still keeps on-page result */ } setCopied(true); };
  return <DashboardShell active="visitor" title="visitor" subtitleText={detailText(locale, "visitorSubtitle")} generatedAt={data?.generatedAt}>
    <form className="visitor-search" onSubmit={submit}><label><span className="sr-only">{detailText(locale, "visitorSearch")}</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={detailText(locale, "visitorSearch")} maxLength={22} /></label><button type="submit"><Search />{detailText(locale, "searchVisitor")}</button></form>
    {!visitorID ? <div className="visitor-prompt"><ShieldCheck /><p>{detailText(locale, "privacyDetail")}</p></div> : loading ? <QueryState kind="loading" title={monitoringCopy(locale, "loadingTitle")} body={monitoringCopy(locale, "loadingBody")} /> : error ? <QueryState kind={error.code === "ANALYTICS_STORAGE_UNAVAILABLE" ? "storage_unavailable" : "query_failed"} title={monitoringCopy(locale, error.code === "ANALYTICS_STORAGE_UNAVAILABLE" ? "storageUnavailableTitle" : "queryFailedTitle")} body={monitoringCopy(locale, "queryFailedBody")} /> : data && <>
      <section className="visitor-summary dashboard-card"><div><span>{detailText(locale, "visitorSummary")}</span><code>{data.visitor.visitorId}</code></div><dl><dt>{detailText(locale, "firstSeen")}</dt><dd>{formatDate(data.visitor.firstSeenAt, locale)}</dd><dt>{detailText(locale, "lastSeen")}</dt><dd>{formatDate(data.visitor.lastSeenAt, locale)}</dd><dt>{detailText(locale, "eventCount")}</dt><dd>{data.visitor.eventCount}</dd><dt>{detailText(locale, "sessionCount")}</dt><dd>{data.visitor.sessionCount}</dd></dl><button type="button" onClick={copy}><Copy />{detailText(locale, "copyId")}</button><p className="copy-feedback" aria-live="polite">{copied ? detailText(locale, "copiedId") : ""}</p></section>
      <VisitorTimeline sessions={data.sessions} locale={locale} />
    </>}
  </DashboardShell>;
}
