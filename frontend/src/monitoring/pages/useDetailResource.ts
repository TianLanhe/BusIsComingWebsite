import { useEffect, useState } from "react";
import { useAnalyticsFilters } from "../app/FilterProvider";
import { AnalyticsClientError } from "../services/analyticsClient";
import type { AnalyticsQuery } from "../services/analyticsTypes";

export function useDetailResource<T>(loader: (query: AnalyticsQuery, signal?: AbortSignal) => Promise<T>) {
  const filters = useAnalyticsFilters();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AnalyticsClientError | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    void loader(filters.query, controller.signal).then((result) => { if (active) { setData(result); setError(null); setLoading(false); } }).catch((caught) => {
      if (!active || (caught instanceof DOMException && caught.name === "AbortError")) return;
      setError(caught instanceof AnalyticsClientError ? caught : new AnalyticsClientError("ANALYTICS_QUERY_FAILED", 0)); setLoading(false);
    });
    return () => { active = false; controller.abort(); };
  }, [filters.query, filters.refreshVersion, loader]);
  return { data, error, loading };
}
