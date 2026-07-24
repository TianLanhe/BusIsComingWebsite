import type { Metric } from "../services/analyticsTypes";

export type ComparisonViewState = "increased" | "decreased" | "unchanged" | "zero_baseline" | "no_previous" | "no_current" | "disabled";
export type ComparisonPresentation = "neutral" | "lower_is_better";
export type ComparisonDirection = "up" | "down" | "none";
export type ComparisonOutcome = "neutral" | "better" | "worse";

export interface ComparisonState {
  viewState: ComparisonViewState;
  direction: ComparisonDirection;
  outcome: ComparisonOutcome;
  delta: number | null;
  deltaRate: number | null;
}

export function deriveComparisonState(metric: Metric | undefined, compareEnabled: boolean, presentation: ComparisonPresentation = "neutral"): ComparisonState {
  if (metric?.value == null) return { viewState: "no_current", direction: "none", outcome: "neutral", delta: null, deltaRate: null };
  if (!compareEnabled) return { viewState: "disabled", direction: "none", outcome: "neutral", delta: null, deltaRate: null };
  if (metric.previousValue == null || metric.delta == null) return { viewState: "no_previous", direction: "none", outcome: "neutral", delta: null, deltaRate: null };
  if (metric.previousValue === 0 && metric.value > 0) {
    // 上期真实为零时不能以无穷百分比表达变化，仍保留绝对增量和方向。
    return { viewState: "zero_baseline", direction: "up", outcome: outcomeFor("up", presentation), delta: metric.delta, deltaRate: null };
  }
  if (metric.delta === 0) return { viewState: "unchanged", direction: "none", outcome: "neutral", delta: 0, deltaRate: 0 };
  const direction = metric.delta > 0 ? "up" : "down";
  return { viewState: direction === "up" ? "increased" : "decreased", direction, outcome: outcomeFor(direction, presentation), delta: metric.delta, deltaRate: metric.deltaRate };
}

function outcomeFor(direction: Exclude<ComparisonDirection, "none">, presentation: ComparisonPresentation): ComparisonOutcome {
  // 方向描述数值变化；失败数和时延另以反向语义判断好坏，二者不能混为同一状态。
  if (presentation === "neutral") return "neutral";
  return direction === "up" ? "worse" : "better";
}
