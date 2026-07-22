import { ArrowLeft, Copy, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { DistributionChart } from "../components/charts/DistributionChart";
import { DashboardShell } from "../components/layout/DashboardShell";
import { QueryState } from "../components/states/QueryState";
import { formatDate } from "../components/tables/EventTable";
import { VisitorTimeline } from "../components/timeline/VisitorTimeline";
import { monitoringCopy } from "../content/copy";
import { detailText, dimensionText, eventLabels } from "../content/types";
import { AnalyticsClientError } from "../services/analyticsClient";
import { fetchVisitor } from "../services/analyticsDetailsClient";
import type { VisitorData } from "../services/analyticsTypes";
import { DetailHeading } from "./TrafficPage";

export function VisitorPage({ initialVisitorID, loadVisitor = fetchVisitor }: { initialVisitorID?: string; loadVisitor?: (visitorID: string, limit: number, cursor?: string, signal?: AbortSignal) => Promise<VisitorData> }) {
  const { locale } = useMonitoringI18n();
  const historyVisitor = (window.history.state as { analyticsVisitorId?: string } | null)?.analyticsVisitorId;
  const [input, setInput] = useState(initialVisitorID ?? historyVisitor ?? "");
  const [visitorID, setVisitorID] = useState(initialVisitorID ?? historyVisitor ?? "");
  const [data, setData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(Boolean(visitorID));
  const [error, setError] = useState<AnalyticsClientError | null>(null);
  const [inputError, setInputError] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (!visitorID) return;
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setCopyState("idle");
    void loadVisitor(visitorID, 50, undefined, controller.signal).then((result) => {
      if (active) {
        setData(result);
        setError(null);
        setLoading(false);
      }
    }).catch((caught) => {
      if (active && !(caught instanceof DOMException && caught.name === "AbortError")) {
        setError(caught instanceof AnalyticsClientError ? caught : new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 0));
        setLoading(false);
      }
    });
    return () => { active = false; controller.abort(); };
  }, [loadVisitor, visitorID]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const valid = /^[A-Za-z0-9_-]{22}$/.test(input);
    setInputError(!valid);
    if (valid) setVisitorID(input);
  };
  const copy = async () => {
    if (!data) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(data.visitor.visitorId);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };
  const compositionLabels = Object.fromEntries((data?.visitor.eventComposition ?? []).map((item) => [item.key, eventLabels[item.key as keyof typeof eventLabels]?.[locale] ?? item.key]));

  return <DashboardShell active="visitor" title="visitor" subtitleText={detailText(locale, "visitorSubtitle")} generatedAt={data?.generatedAt}>
    <div className="visitor-actions"><a className="back-link" href="#events"><ArrowLeft />{detailText(locale, "backToEvents")}</a></div>
    <form className="visitor-search" onSubmit={submit} noValidate><label><span className="sr-only">{detailText(locale, "visitorSearch")}</span><input value={input} onChange={(event) => { setInput(event.target.value); setInputError(false); }} placeholder={detailText(locale, "visitorSearch")} maxLength={22} aria-invalid={inputError} aria-describedby={inputError ? "visitor-id-error" : undefined} /></label><button type="submit"><Search />{detailText(locale, "searchVisitor")}</button>{inputError && <p id="visitor-id-error" className="visitor-input-error" role="alert">{detailText(locale, "invalidVisitorId")}</p>}</form>
    {!visitorID ? <div className="visitor-prompt"><ShieldCheck /><p>{detailText(locale, "privacyDetail")}</p></div> : loading ? <QueryState kind="loading" title={monitoringCopy(locale, "loadingTitle")} body={monitoringCopy(locale, "loadingBody")} /> : error ? <QueryState kind={error.code === "ANALYTICS_STORAGE_UNAVAILABLE" ? "storage_unavailable" : "query_failed"} title={monitoringCopy(locale, error.code === "ANALYTICS_STORAGE_UNAVAILABLE" ? "storageUnavailableTitle" : "queryFailedTitle")} body={monitoringCopy(locale, "queryFailedBody")} /> : data && <>
      <section className="visitor-identity dashboard-card"><div><span>{detailText(locale, "visitorSummary")}</span><code>{data.visitor.visitorId}</code><small>{formatDate(data.visitor.firstSeenAt, locale)} — {formatDate(data.visitor.lastSeenAt, locale)}</small></div><button type="button" onClick={copy}><Copy />{detailText(locale, "copyId")}</button><p className={`copy-feedback ${copyState}`} aria-live="polite">{copyState === "copied" ? detailText(locale, "copiedId") : copyState === "failed" ? detailText(locale, "copyFailed") : ""}</p></section>
      <section className="visitor-fact-grid">
        <VisitorFact label={detailText(locale, "eventCount")} value={new Intl.NumberFormat(locale).format(data.visitor.eventCount)} />
        <VisitorFact label={detailText(locale, "sessionCount")} value={new Intl.NumberFormat(locale).format(data.visitor.sessionCount)} />
        <VisitorFact label={detailText(locale, "commonLocale")} value={dimensionText(locale, data.visitor.commonLocale)} />
        <VisitorFact label={detailText(locale, "commonDevice")} value={dimensionText(locale, data.visitor.commonDeviceType)} />
      </section>
      <section className="detail-grid-2 visitor-insights"><article className="dashboard-card compact-card"><DetailHeading title={detailText(locale, "eventComposition")} note={detailText(locale, "pageSummary").replace("{count}", String(data.visitor.eventCount))} /><DistributionChart items={data.visitor.eventComposition} locale={locale} labels={compositionLabels} /></article><article className="dashboard-card visitor-classification"><DetailHeading title={detailText(locale, "commonPlatform")} note={detailText(locale, "commonSource")} /><strong>{data.visitor.commonPlatform ? dimensionText(locale, data.visitor.commonPlatform) : detailText(locale, "noPlatformData")}</strong><dl><dt>{detailText(locale, "commonSource")}</dt><dd>{dimensionText(locale, data.visitor.commonSourceType)}</dd><dt>{detailText(locale, "firstSeen")}</dt><dd>{formatDate(data.visitor.firstSeenAt, locale)}</dd><dt>{detailText(locale, "lastSeen")}</dt><dd>{formatDate(data.visitor.lastSeenAt, locale)}</dd></dl></article></section>
      <VisitorTimeline sessions={data.sessions} locale={locale} />
    </>}
  </DashboardShell>;
}

function VisitorFact({ label, value }: { label: string; value: string }) {
  return <article className="dashboard-card visitor-fact"><span>{label}</span><strong>{value}</strong></article>;
}
