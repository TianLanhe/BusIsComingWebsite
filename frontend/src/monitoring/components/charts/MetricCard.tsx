import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Metric } from "../../services/analyticsTypes";

export function MetricCard({ label, metric, locale, format }: { label: string; metric?: Metric; locale: string; format?: "number" | "decimal" | "percent" }) {
  const delta = metric?.deltaRate;
  const DeltaIcon = delta == null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return <article className="dashboard-card metric-card" data-testid="metric-card">
    <div className="metric-label"><span>{label}</span><i /></div>
    <strong>{formatMetric(metric?.value ?? null, locale, format)}</strong>
    <span className={`metric-delta ${delta != null && delta < 0 ? "negative" : ""}`}><DeltaIcon size={14} />{delta == null ? "—" : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(delta)}</span>
  </article>;
}

function formatMetric(value: number | null, locale: string, format: "number" | "decimal" | "percent" = "number") {
  if (value == null) return "—";
  if (format === "percent") return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: format === "decimal" ? 2 : 0 }).format(value);
}
