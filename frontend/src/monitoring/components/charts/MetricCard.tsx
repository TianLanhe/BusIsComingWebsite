import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { monitoringCopy } from "../../content/copy";
import { deriveComparisonState, type ComparisonPresentation } from "../../model/comparisonState";
import type { Metric } from "../../services/analyticsTypes";

type MetricValueFormat = "count" | "percent" | "durationMs" | "decimal";

export function MetricCard({ label, metric, locale, format = "count", compareEnabled = true, presentation = "neutral" }: {
  label: string;
  metric?: Metric;
  locale: string;
  format?: MetricValueFormat;
  compareEnabled?: boolean;
  presentation?: ComparisonPresentation;
}) {
  const state = deriveComparisonState(metric, compareEnabled, presentation);
  const formatted = formatMetric(metric?.value ?? null, locale, format);
  const long = formatted.replace(/\s/g, "").length >= 8;
  const text = (key: Parameters<typeof monitoringCopy>[1]) => monitoringCopy(locale as "zh-Hans" | "zh-Hant" | "en", key);

  return <article className="dashboard-card metric-card" data-testid="metric-card">
    <div className="metric-label"><span>{label}</span></div>
    <strong className={`metric-value ${long ? "long" : ""}`}>{formatted}</strong>
    <div className={`metric-comparison ${state.viewState} ${state.outcome}`}>
      {state.direction === "up" && <><ArrowUpRight aria-hidden="true" /><b>{formatChange(state.deltaRate, state.delta ?? 0, locale, format)}</b><span>{text("compared")}</span></>}
      {state.direction === "down" && <><ArrowDownRight aria-hidden="true" /><b>{formatChange(state.deltaRate, state.delta ?? 0, locale, format)}</b><span>{text("compared")}</span></>}
      {state.viewState === "unchanged" && <><Minus aria-hidden="true" /><b>0%</b><span>{text("comparisonUnchanged")}</span></>}
      {state.viewState === "no_previous" && <span>{text("comparisonMissing")}</span>}
      {state.viewState === "disabled" && <span>{text("comparisonOff")}</span>}
      {state.viewState === "no_current" && <span>{text("currentMissing")}</span>}
    </div>
  </article>;
}

function formatMetric(value: number | null, locale: string, format: MetricValueFormat = "count") {
  if (value == null) return "—";
  if (format === "percent") return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value);
  if (format === "durationMs") return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} ms`;
  return new Intl.NumberFormat(locale, { maximumFractionDigits: format === "decimal" ? 2 : 0 }).format(value);
}

function formatChange(rate: number | null, delta: number, locale: string, format: MetricValueFormat) {
  // 时延的百分比不如毫秒差值直观，且零基线时绝不能展示无穷百分比。
  if (format === "durationMs") return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0, signDisplay: "always" }).format(delta)} ms`;
  if (rate != null) return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "always" }).format(rate);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, signDisplay: "always" }).format(delta);
}
