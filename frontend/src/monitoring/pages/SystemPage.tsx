import { Database, Radio, ServerCog } from "lucide-react";
import { useEffect, useState } from "react";
import { useAnalyticsFilters } from "../app/FilterProvider";
import { useMonitoringI18n } from "../app/MonitoringI18nProvider";
import { DashboardShell } from "../components/layout/DashboardShell";
import { QueryState } from "../components/states/QueryState";
import { monitoringCopy } from "../content/copy";
import { detailText } from "../content/types";
import { SYSTEM_FACTS, type SystemFactGroup, type SystemFactKey } from "../model/systemFacts";
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
    const controller = new AbortController(); let active = true;
    setLoading(true);
    void loadSystem(controller.signal).then((result) => { if (active) { setData(result); setError(null); setLoading(false); } }).catch((caught) => {
      if (active && !(caught instanceof DOMException && caught.name === "AbortError")) { setError(caught instanceof AnalyticsClientError ? caught : new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 0)); setLoading(false); }
    });
    return () => { active = false; controller.abort(); };
  }, [filters.refreshVersion, loadSystem]);

  return <DashboardShell active="system" title="system" subtitleText={detailText(locale, "systemSubtitle")} generatedAt={data?.generatedAt}>
    {loading ? <QueryState kind="loading" title={monitoringCopy(locale, "loadingTitle")} body={monitoringCopy(locale, "loadingBody")} /> : error ? <QueryState kind="query_failed" title={monitoringCopy(locale, "queryFailedTitle")} body={monitoringCopy(locale, "queryFailedBody")} /> : data && <div className="system-workspace" data-testid="system-workspace">
      <FactGroup icon={Database} title={detailText(locale, "systemDatabase")} group="storage" data={data} locale={locale} />
      <FactGroup icon={ServerCog} title={detailText(locale, "sqliteRuntime")} group="sqlite" data={data} locale={locale} />
      <FactGroup icon={Radio} title={detailText(locale, "serviceRuntime")} group="service" data={data} locale={locale} />
    </div>}
  </DashboardShell>;
}

function FactGroup({ icon: Icon, title, group, data, locale }: { icon: typeof Database; title: string; group: SystemFactGroup; data: SystemData; locale: "zh-Hans" | "zh-Hant" | "en" }) {
  const facts = SYSTEM_FACTS.filter((fact) => fact.group === group);
  return <section className="dashboard-card system-fact-panel"><header className="system-section-heading"><span><Icon /></span><h2>{title}</h2></header><dl className="system-facts-grid">
    {facts.map((fact) => <Fact key={fact.key} fact={fact.key} data={data} locale={locale} />)}
  </dl></section>;
}

function Fact({ fact, data, locale }: { fact: SystemFactKey; data: SystemData; locale: "zh-Hans" | "zh-Hant" | "en" }) {
  const value = factValue(fact, data, locale);
  return <div className="system-fact" data-testid="system-fact"><dt>{detailText(locale, fact)}</dt><dd className={value === null ? "no-data" : undefined}>{value ?? detailText(locale, "noData")}</dd></div>;
}

function factValue(fact: SystemFactKey, data: SystemData, locale: string): string | null {
  switch (fact) {
    case "rowCount": return formatNumber(data.database.rowCount, locale);
    case "todayRowCount": { const count = formatNumber(data.database.todayRowCount, locale); return count === null ? null : `${count} · ${data.database.todayLocalDate}`; }
    case "databaseSize": return formatBytes(data.database.sizeBytes, locale);
    case "lastSuccessfulWrite": return formatDate(data.database.lastSuccessfulWriteAt, locale);
    case "sqliteVersion": return data.sqlite.version;
    case "journalMode": return data.sqlite.journalMode;
    case "schemaVersion": return data.sqlite.schemaVersion;
    case "processStarted": return formatDate(data.process.startedAt, locale);
    case "processUptime": return formatDuration(data.process.uptimeMs, locale);
    case "dropped": return formatNumber(data.process.droppedSinceStart, locale);
    case "listenerState": return data.privateListener.state === null ? null : stateLabel(data.privateListener.state, locale);
    case "listenerAddress": return data.privateListener.bindAddress;
  }
}

function stateLabel(state: string, locale: string) { return state === "available" ? detailText(locale as "zh-Hans", "healthy") : state === "starting" || state === "degraded" ? detailText(locale as "zh-Hans", "degraded") : detailText(locale as "zh-Hans", "unavailable"); }
function formatNumber(value: number | null, locale: string) { return value == null ? null : new Intl.NumberFormat(locale).format(value); }
function formatBytes(value: number | null, locale: string) {
  if (value == null) return null;
  const units = ["B", "KB", "MB", "GB"];
  let amount = value, unit = 0;
  while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit += 1; }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: amount < 10 && unit > 0 ? 1 : 0 }).format(amount)} ${units[unit]}`;
}
function formatDate(value: string | null, locale: string) { return value == null ? null : new Intl.DateTimeFormat(locale, { timeZone: "Asia/Hong_Kong", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatDuration(value: number | null, locale: string) {
  if (value == null) return null;
  const labels = locale === "en" ? ["s", "min", "h"] : locale === "zh-Hant" ? ["秒", "分鐘", "小時"] : ["秒", "分钟", "小时"];
  if (value > 0 && value < 1000) return `<1 ${labels[0]}`;
  let amount = value / 1000, unit = 0;
  if (amount >= 60) { amount /= 60; unit = 1; }
  if (amount >= 60) { amount /= 60; unit = 2; }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: amount < 10 && unit > 0 ? 1 : 0 }).format(amount)} ${labels[unit]}`;
}
