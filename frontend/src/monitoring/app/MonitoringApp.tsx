import { useHashRoute } from "./hashRoute";
import { DownloadsPage } from "../pages/DownloadsPage";
import { EventsPage } from "../pages/EventsPage";
import { OverviewPage } from "../pages/OverviewPage";
import { PerformancePage } from "../pages/PerformancePage";
import { SystemPage } from "../pages/SystemPage";
import { TrafficPage } from "../pages/TrafficPage";
import { VisitorPage } from "../pages/VisitorPage";

export function MonitoringApp() {
  const route = useHashRoute();
  switch (route) {
    case "traffic": return <TrafficPage />;
    case "downloads": return <DownloadsPage />;
    case "events": return <EventsPage />;
    case "visitor": return <VisitorPage />;
    case "performance": return <PerformancePage />;
    case "system": return <SystemPage />;
    default: return <OverviewPage />;
  }
}
