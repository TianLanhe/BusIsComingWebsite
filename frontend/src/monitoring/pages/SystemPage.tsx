import { Activity, Database, Radio, ServerCog, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAnalyticsFilters } from "../app/FilterProvider";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { DashboardShell } from "../components/layout/DashboardShell";
import { QueryState } from "../components/states/QueryState";
import { monitoringCopy } from "../content/copy";
import { detailText } from "../content/types";
import { SYSTEM_FACTS, type SystemFactGroup } from "../model/systemFacts";
import { AnalyticsClientError } from "../services/analyticsClient";
import { fetchSystem } from "../services/analyticsDetailsClient";
import type { SystemData } from "../services/analyticsTypes";

export function SystemPage({ loadSystem = fetchSystem }: { loadSystem?: (signal?: AbortSignal) => Promise<SystemData> }) {
  const { locale } = useMonitoringI18n();
  const filters = useAnalyticsFilters();
  const [data, setData] = useState<SystemData | null>(null);
  const [error, setError] = useState<AnalyticsClientError | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    void loadSystem(controller.signal).then((result) => {
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
  }, [filters.refreshVersion, loadSystem]);

  return <DashboardShell active="system" title="system" subtitleText={detailText(locale, "systemSubtitle")} generatedAt={data?.generatedAt}>
    {loading ? <QueryState kind="loading" title={monitoringCopy(locale, "loadingTitle")} body={monitoringCopy(locale, "loadingBody")} /> : error ? <QueryState kind="query_failed" title={monitoringCopy(locale, "queryFailedTitle")} body={monitoringCopy(locale, "queryFailedBody")} /> : data && <div className="system-workspace" data-testid="system-workspace">
      <section className="system-section"><SectionHeading icon={Activity} title={detailText(locale, "runtimeStatus")} /><div className="system-status-grid">
        <SystemCard icon={Database} title={detailText(locale, "systemDatabase")} state={data.database.state} locale={locale}><Stat label={detailText(locale, "rowCount")} value={formatNumber(data.database.rowCount, locale)} /></SystemCard>
        <SystemCard icon={ShieldCheck} title={detailText(locale, "writeHealth")} state={data.database.state} locale={locale}><Stat label={detailText(locale, "lastSuccessfulWrite")} value={formatDate(data.database.lastSuccessfulWriteAt, locale)} /></SystemCard>
        <SystemCard icon={ServerCog} title={detailText(locale, "systemProcess")} state="available" locale={locale}><Stat label={detailText(locale, "processStarted")} value={formatDate(data.process.startedAt, locale)} /><Stat label={detailText(locale, "dropped")} value={formatNumber(data.process.droppedSinceStart, locale)} /></SystemCard>
        <SystemCard icon={Radio} title={detailText(locale, "systemListener")} state={data.privateListener.state} locale={locale}><Stat label={detailText(locale, "listenerState")} value={stateLabel(data.privateListener.state, locale)} /></SystemCard>
      </div></section>
      <section className="system-detail-grid"><article className="dashboard-card system-fact-panel"><SectionHeading icon={Database} title={detailText(locale, "storageOverview")} /><dl className="system-stats"><Stat label={detailText(locale, "rowCount")} value={formatNumber(data.database.rowCount, locale)} /><Stat label={detailText(locale, "databaseSize")} value={formatBytes(data.database.sizeBytes, locale)} /><Stat label={detailText(locale, "lastSuccessfulWrite")} value={formatDate(data.database.lastSuccessfulWriteAt, locale)} /></dl><FactList group="storage" locale={locale} /></article><article className="dashboard-card system-fact-panel"><SectionHeading icon={ShieldCheck} title={detailText(locale, "isolationFallback")} /><dl className="system-stats"><Stat label={detailText(locale, "listenerAddress")} value={data.privateListener.bindAddress ?? "—"} /><Stat label={detailText(locale, "publicProxy")} value={detailText(locale, "noPublicProxy")} /></dl><FactList group="isolation" locale={locale} /></article></section>
    </div>}
  </DashboardShell>;
}

function SectionHeading({ icon: Icon, title }: { icon: typeof Database; title: string }) { return <header className="system-section-heading"><span><Icon /></span><h2>{title}</h2></header>; }
function SystemCard({ icon: Icon, title, state, locale, children }: { icon: typeof Database; title: string | null; state: string | null; locale: "zh-Hans" | "zh-Hant" | "en"; children: React.ReactNode }) { return <article className="dashboard-card system-status-card" data-testid="dynamic-status-card"><header><span><Icon /></span><div><h3>{title}</h3><p className={`system-state ${state ?? "unavailable"}`}><i />{stateLabel(state, locale)}</p></div></header><dl>{children}</dl></article>; }
function Stat({ label, value }: { label: string; value: string }) { return <><dt>{label}</dt><dd>{value}</dd></>; }
function FactList({ group, locale }: { group: SystemFactGroup; locale: "zh-Hans" | "zh-Hant" | "en" }) { return <ul className="system-facts">{SYSTEM_FACTS.filter((fact) => fact.group === group).map((fact) => <li key={fact.id}><span>{detailText(locale, "configurationFact")}</span><p>{detailText(locale, fact.copyKey)}</p></li>)}</ul>; }
function stateLabel(state: string | null, locale: "zh-Hans" | "zh-Hant" | "en") { return state === "available" ? detailText(locale, "healthy") : state === "degraded" || state === "starting" ? detailText(locale, "degraded") : detailText(locale, "unavailable"); }
function formatNumber(value: number | null, locale: string) { return value == null ? "—" : new Intl.NumberFormat(locale).format(value); }
function formatBytes(value: number | null, locale: string) { return value == null ? "—" : new Intl.NumberFormat(locale, { style: "unit", unit: "megabyte", maximumFractionDigits: 2 }).format(value / 1_000_000); }
function formatDate(value: string | null, locale: string) { return value == null ? "—" : new Intl.DateTimeFormat(locale, { timeZone: "Asia/Hong_Kong", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
