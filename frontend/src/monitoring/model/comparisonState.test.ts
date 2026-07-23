import { describe, expect, it } from "vitest";
import { deriveComparisonState } from "./comparisonState";
import type { Metric } from "../services/analyticsTypes";

const metric = (overrides: Partial<Metric> = {}): Metric => ({
  key: "metric",
  value: 100,
  previousValue: 80,
  delta: 20,
  deltaRate: 0.25,
  ...overrides,
});

describe("deriveComparisonState", () => {
  it("keeps change direction separate from lower-is-better presentation", () => {
    expect(deriveComparisonState(metric(), true, "neutral")).toMatchObject({ viewState: "increased", direction: "up", outcome: "neutral" });
    expect(deriveComparisonState(metric(), true, "lower_is_better")).toMatchObject({ viewState: "increased", direction: "up", outcome: "worse" });
    expect(deriveComparisonState(metric({ value: 60, delta: -20, deltaRate: -0.25 }), true, "lower_is_better")).toMatchObject({ viewState: "decreased", direction: "down", outcome: "better" });
  });

  it("distinguishes unchanged, zero baseline, missing samples, and disabled comparison", () => {
    expect(deriveComparisonState(metric({ previousValue: 100, delta: 0, deltaRate: 0 }), true)).toMatchObject({ viewState: "unchanged", direction: "none" });
    expect(deriveComparisonState(metric({ previousValue: 0, delta: 100, deltaRate: null }), true)).toMatchObject({ viewState: "zero_baseline", direction: "up" });
    expect(deriveComparisonState(metric({ previousValue: null, delta: null, deltaRate: null }), true)).toMatchObject({ viewState: "no_previous", direction: "none" });
    expect(deriveComparisonState(metric({ value: null }), true)).toMatchObject({ viewState: "no_current", direction: "none" });
    expect(deriveComparisonState(metric(), false)).toMatchObject({ viewState: "disabled", direction: "none" });
  });
});
