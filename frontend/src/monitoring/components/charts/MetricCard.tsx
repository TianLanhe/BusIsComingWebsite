import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { monitoringCopy } from "../../content/copy";
import { deriveComparisonState } from "../../model/comparisonState";
import type { Metric } from "../../services/analyticsTypes";

export function MetricCard({ label, metric, locale, format, compareEnabled = true }: {
  label: string;
  metric?: Metric;
  locale: string;
  format?: "number" | "decimal" | "percent";
  compareEnabled?: boolean;
}) {
  const state = deriveComparisonState(metric, compareEnabled);
  const formatted = formatMetric(metric?.value ?? null, locale, format);
  const long = formatted.replace(/\s/g, "").length >= 8;
  const text = (key: Parameters<typeof monitoringCopy>[1]) => monitoringCopy(locale as "zh-Hans" | "zh-Hant" | "en", key);

  return <article className="dashboard-card metric-card" data-testid="metric-card">
    <div className="metric-label"><span>{label}</span></div>
    <strong className={`metric-value ${long ? "long" : ""}`}>{formatted}</strong>
    <div className={`metric-comparison ${state.kind}`}>
      {state.kind === "positive" && <><ArrowUpRight aria-hidden="true" /><b>{formatChange(state.deltaRate, state.delta, locale)}</b><span>{text("compared")}</span></>}
      {state.kind === "negative" && <><ArrowDownRight aria-hidden="true" /><b>{formatChange(state.deltaRate, state.delta, locale)}</b><span>{text("compared")}</span></>}
      {state.kind === "unchanged" && <><Minus aria-hidden="true" /><b>0%</b><span>{text("comparisonUnchanged")}</span></>}
      {state.kind === "no_comparison_data" && <span>{text("comparisonMissing")}</span>}
      {state.kind === "comparison_off" && <span>{text("comparisonOff")}</span>}
      {state.kind === "current_missing" && <span>{text("currentMissing")}</span>}
    </div>
  </article>;
}

function formatMetric(value: number | null, locale: string, format: "number" | "decimal" | "percent" = "number") {
  if (value == null) return "—";
  if (format === "percent") return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: format === "decimal" ? 2 : 0 }).format(value);
}

function formatChange(rate: number | null, delta: number, locale: string) {
  if (rate != null) return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "always" }).format(rate);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, signDisplay: "always" }).format(delta);
}
