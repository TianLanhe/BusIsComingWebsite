import { useHashRoute } from "./hashRoute";
import { DashboardShell } from "../components/layout/DashboardShell";
import { useMonitoringI18n } from "./MonitoringI18nProvider";
import { monitoringCopy } from "../content/copy";
import { OverviewPage } from "../pages/OverviewPage";

export function MonitoringApp() {
  const route = useHashRoute();
  const { locale } = useMonitoringI18n();
  if (route === "overview") return <OverviewPage />;
  return <DashboardShell active={route} title={route} subtitle="pageSubtitle"><section className="workspace-placeholder"><h2>{monitoringCopy(locale, route)}</h2><p>{monitoringCopy(locale, "navSoon")}</p></section></DashboardShell>;
}
