import { Activity, BarChart3, Clock3, Database, Download, Gauge, LayoutDashboard, Menu, RefreshCw, Route, Search, ShieldCheck, Users, X } from "lucide-react";
import { useState } from "react";
import { useAnalyticsFilters } from "../../app/FilterProvider";
import type { MonitorRoute } from "../../app/hashRoute";
import { useMonitoringI18n } from "../../app/MonitoringI18nProvider";
import { monitoringCopy, type CopyKey } from "../../content/copy";
import { GlobalFilters } from "../filters/GlobalFilters";
import { MonitoringLanguageSwitcher } from "./MonitoringLanguageSwitcher";

const nav: { route: MonitorRoute; label: CopyKey; icon: typeof Activity; group: "monitor" | "diagnostics" }[] = [
  { route: "overview", label: "overview", icon: LayoutDashboard, group: "monitor" },
  { route: "traffic", label: "traffic", icon: Route, group: "monitor" },
  { route: "downloads", label: "downloads", icon: Download, group: "monitor" },
  { route: "events", label: "events", icon: Search, group: "diagnostics" },
  { route: "visitor", label: "visitor", icon: Users, group: "diagnostics" },
  { route: "performance", label: "performance", icon: Gauge, group: "diagnostics" },
  { route: "system", label: "system", icon: Database, group: "diagnostics" },
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
      <NavGroup title={t("monitorCenter")} group="monitor" active={active} t={t} />
      <NavGroup title={t("diagnostics")} group="diagnostics" active={active} t={t} />
      <div className="sidebar-status"><ShieldCheck size={18} /><div>{t("privateAccess")}<span><i />{t("liveWriting")}</span><small>{t("listener")}</small></div></div>
    </aside>
    <main className="monitor-main">
      <header className="monitor-topbar">
        <div className="mobile-brand-row"><Brand compact /><button type="button" aria-label={t("mobileMenu")} onClick={() => setMenuOpen(true)}><Menu /></button></div>
        <div className="title-block"><p>{t("brandEyebrow")}</p><h1>{titleText ?? t(title)}</h1><span>{subtitleText ?? t(subtitle)}</span></div>
        <div className="topbar-controls">
          <label className="monitor-control"><Clock3 size={15} /><select value={filters.rangeDays} onChange={(event) => filters.setRangeDays(Number(event.target.value))} aria-label="Date range"><option value={7}>{t("range7")}</option><option value={30}>{t("range30")}</option><option value={90}>{t("range90")}</option></select></label>
          <label className="monitor-control"><BarChart3 size={15} /><select value={filters.query.granularity} onChange={(event) => filters.setGranularity(event.target.value as typeof filters.query.granularity)} aria-label="Granularity"><option value="hour">{t("hourly")}</option><option value="day">{t("daily")}</option><option value="week">{t("weekly")}</option><option value="month">{t("monthly")}</option></select></label>
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
    {menuOpen && <div className="mobile-drawer" role="dialog" aria-modal="true"><div className="drawer-head"><Brand compact /><button type="button" aria-label={t("close")} onClick={() => setMenuOpen(false)}><X /></button></div><NavGroup title={t("monitorCenter")} group="monitor" active={active} t={t} /><NavGroup title={t("diagnostics")} group="diagnostics" active={active} t={t} /><div className="drawer-status">{t("privateAccess")}</div></div>}
    <nav className="mobile-bottom-nav" data-testid="mobile-bottom-nav" aria-label={t("monitorCenter")}>{nav.slice(0, 4).map((item) => <NavLink key={item.route} item={item} active={active} t={t} />)}</nav>
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`monitor-brand ${compact ? "compact" : ""}`}><span className="brand-mark">B</span><span><b>BusIsComing</b><small>Pulse</small></span></div>;
}

function NavGroup({ title, group, active, t }: { title: string; group: "monitor" | "diagnostics"; active: MonitorRoute; t: (key: CopyKey) => string }) {
  return <nav className="nav-group" aria-label={title}><p>{title}</p>{nav.filter((item) => item.group === group).map((item) => <NavLink key={item.route} item={item} active={active} t={t} />)}</nav>;
}

function NavLink({ item, active, t }: { item: typeof nav[number]; active: MonitorRoute; t: (key: CopyKey) => string }) {
  const Icon = item.icon;
  return <a href={`#${item.route}`} className={active === item.route ? "active" : ""} aria-current={active === item.route ? "page" : undefined}><Icon size={17} /><span>{t(item.label)}</span></a>;
}

function formatTime(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(value));
  } catch {
    return "—";
  }
}
