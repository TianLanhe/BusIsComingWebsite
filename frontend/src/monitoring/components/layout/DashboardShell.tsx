import { Activity, BarChart3, Database, Download, Gauge, LayoutDashboard, Menu, RefreshCw, Route, Search, Users, X } from "lucide-react";
import { useState } from "react";
import { useAnalyticsFilters } from "../../app/FilterProvider";
import type { MonitorRoute } from "../../app/hashRoute";
import { useMonitoringI18n } from "../../app/MonitoringI18nProvider";
import { monitoringCopy, type CopyKey } from "../../content/copy";
import { GlobalFilters } from "../filters/GlobalFilters";
import { DateRangeControl } from "../filters/DateRangeControl";
import { MonitoringLanguageSwitcher } from "./MonitoringLanguageSwitcher";

type NavigationGroup = "business" | "technical" | "details";
const navGroups: { key: NavigationGroup; label: CopyKey; items: { route: MonitorRoute; label: CopyKey; icon: typeof Activity }[] }[] = [
  { key: "business", label: "businessMonitoring", items: [{ route: "overview", label: "overview", icon: LayoutDashboard }, { route: "traffic", label: "traffic", icon: Route }, { route: "downloads", label: "downloads", icon: Download }] },
  { key: "technical", label: "technicalMonitoring", items: [{ route: "performance", label: "performance", icon: Gauge }, { route: "system", label: "system", icon: Database }] },
  { key: "details", label: "dataDetails", items: [{ route: "events", label: "events", icon: Search }, { route: "visitor", label: "visitor", icon: Users }] },
];

export function DashboardShell({ active = "overview", title = "pageTitle", subtitle = "pageSubtitle", titleText, subtitleText, generatedAt, refreshing = false, children }: {
  active?: MonitorRoute; title?: CopyKey; subtitle?: CopyKey; titleText?: string; subtitleText?: string; generatedAt?: string; refreshing?: boolean; children: React.ReactNode;
}) {
  const { locale } = useMonitoringI18n();
  const filters = useAnalyticsFilters();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = (key: CopyKey) => monitoringCopy(locale, key);
  return <div className="monitor-shell">
    <aside className="monitor-sidebar" data-testid="desktop-sidebar">
      <Brand />
      {navGroups.map((group) => <NavGroup key={group.key} group={group} active={active} t={t} />)}
    </aside>
    <main className="monitor-main">
      <header className="monitor-topbar">
        <div className="mobile-brand-row"><Brand compact /><button type="button" aria-label={t("mobileMenu")} onClick={() => setMenuOpen(true)}><Menu /></button></div>
        <div className="title-block"><p>{t("brandEyebrow")}</p><h1>{titleText ?? t(title)}</h1><span>{subtitleText ?? t(subtitle)}</span></div>
        <div className="topbar-controls">
          <DateRangeControl locale={locale} appliedRange={{ startDate: filters.resolvedRange.displayStartDate, endDate: filters.resolvedRange.displayEndDate }} presetDays={filters.selection.kind === "preset" ? filters.selection.presetDays ?? undefined : undefined} onPresetSelect={filters.setRangeDays} onCommit={(startDate, endDate) => { filters.setCustomRange(startDate, endDate); }} />
          <label className="monitor-control"><BarChart3 size={15} /><select value={filters.query.granularity} onChange={(event) => filters.setGranularity(event.target.value as typeof filters.query.granularity)} aria-label={t("granularity")}><option value="hour">{t("hourly")}</option><option value="day">{t("daily")}</option><option value="week">{t("weekly")}</option><option value="month">{t("monthly")}</option></select></label>
          <MonitoringLanguageSwitcher />
          <button type="button" className="monitor-control primary" onClick={filters.refresh}><RefreshCw size={15} className={refreshing ? "spin" : ""} />{t("refresh")}</button>
        </div>
      </header>
      <div className="monitor-health">
        <span><i />{generatedAt ? `${t("updated")} ${formatTime(generatedAt, locale)} · Asia/Hong_Kong` : t("privateAccess")}</span>
        <span>{t("botExcluded")} · {t("autoRefresh")}</span>
      </div>
      <GlobalFilters />
      <div className="monitor-content">{children}</div>
    </main>
    {menuOpen && <div className="mobile-drawer" role="dialog" aria-modal="true"><div className="drawer-head"><Brand compact /><button type="button" aria-label={t("close")} onClick={() => setMenuOpen(false)}><X /></button></div>{navGroups.map((group) => <NavGroup key={group.key} group={group} active={active} t={t} />)}</div>}
    <nav className="mobile-bottom-nav" data-testid="mobile-bottom-nav" aria-label={t("monitorCenter")}>{navGroups.map((group) => <GroupLink key={group.key} group={group} active={active} t={t} />)}</nav>
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`monitor-brand ${compact ? "compact" : ""}`}><span className="brand-mark">B</span><span><b>BusIsComing</b><small>Pulse</small></span></div>;
}

function NavGroup({ group, active, t }: { group: typeof navGroups[number]; active: MonitorRoute; t: (key: CopyKey) => string }) {
  return <nav className="nav-group" aria-label={t(group.label)}><p>{t(group.label)}</p>{group.items.map((item) => <NavLink key={item.route} item={item} active={active} t={t} />)}</nav>;
}

function NavLink({ item, active, t }: { item: typeof navGroups[number]["items"][number]; active: MonitorRoute; t: (key: CopyKey) => string }) {
  const Icon = item.icon;
  return <a href={`#${item.route}`} className={active === item.route ? "active" : ""} aria-current={active === item.route ? "page" : undefined}><Icon size={17} /><span>{t(item.label)}</span></a>;
}

function GroupLink({ group, active, t }: { group: typeof navGroups[number]; active: MonitorRoute; t: (key: CopyKey) => string }) {
  const item = group.items[0];
  const Icon = item.icon;
  const selected = group.items.some((candidate) => candidate.route === active);
  return <a href={`#${item.route}`} className={selected ? "active" : ""} aria-current={selected ? "page" : undefined}><Icon size={17} /><span>{t(group.label)}</span></a>;
}

function formatTime(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(value));
  } catch {
    return "—";
  }
}
