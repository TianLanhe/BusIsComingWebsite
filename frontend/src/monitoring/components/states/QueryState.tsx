import { AlertTriangle, DatabaseZap, Inbox, LoaderCircle, SearchX } from "lucide-react";

export type QueryStateKind = "loading" | "no_data" | "no_results" | "query_failed" | "storage_unavailable";

const icons = { loading: LoaderCircle, no_data: Inbox, no_results: SearchX, query_failed: AlertTriangle, storage_unavailable: DatabaseZap };

export function QueryState({ kind, title, body, retryLabel, onRetry }: { kind: QueryStateKind; title: string; body: string; retryLabel?: string; onRetry?: () => void }) {
  const Icon = icons[kind];
  const urgent = kind.includes("failed") || kind.includes("unavailable");
  return <section className={`query-state ${kind}`} role={urgent ? "alert" : "status"} aria-live={urgent ? "assertive" : "polite"} aria-busy={kind === "loading"}>
    <span className="query-state-icon"><Icon className={kind === "loading" ? "spin" : ""} /></span>
    <div><h2>{title}</h2><p>{body}</p>{onRetry && <button type="button" onClick={onRetry}>{retryLabel}</button>}</div>
  </section>;
}
