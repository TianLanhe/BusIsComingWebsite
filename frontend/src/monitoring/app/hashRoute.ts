import { useEffect, useState } from "react";

export type MonitorRoute = "overview" | "traffic" | "downloads" | "events" | "visitor" | "performance" | "system";
const routes: MonitorRoute[] = ["overview", "traffic", "downloads", "events", "visitor", "performance", "system"];

export function routeFromHash(hash = window.location.hash): MonitorRoute {
  const candidate = hash.replace(/^#\/?/, "").split("?")[0] as MonitorRoute;
  return routes.includes(candidate) ? candidate : "overview";
}

export function useHashRoute(): MonitorRoute {
  const [route, setRoute] = useState(() => routeFromHash());
  useEffect(() => {
    const sync = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return route;
}
