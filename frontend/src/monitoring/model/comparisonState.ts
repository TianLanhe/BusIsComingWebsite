import type { Metric } from "../services/analyticsTypes";

export type ComparisonState =
  | { kind: "positive" | "negative"; deltaRate: number | null; delta: number }
  | { kind: "unchanged"; deltaRate: 0; delta: 0 }
  | { kind: "no_comparison_data" | "comparison_off" | "current_missing" };

export function deriveComparisonState(metric: Metric | undefined, compareEnabled: boolean): ComparisonState {
  if (metric?.value == null) return { kind: "current_missing" };
  if (!compareEnabled) return { kind: "comparison_off" };
  if (metric.previousValue == null || metric.delta == null) return { kind: "no_comparison_data" };
  if (metric.delta === 0) return { kind: "unchanged", deltaRate: 0, delta: 0 };
  return {
    kind: metric.delta > 0 ? "positive" : "negative",
    deltaRate: metric.deltaRate,
    delta: metric.delta,
  };
}
