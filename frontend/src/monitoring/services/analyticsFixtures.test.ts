import { describe, expect, it } from "vitest";
import * as fixtures from "../../../playwright-monitor/fixtures/details";
import type { AnalyticsMeta } from "./analyticsTypes";

type ComparableMetric = {
  previousValue: number | null;
  delta: number | null;
  deltaRate: number | null;
};

type EventsFixture = { meta: AnalyticsMeta; summaryMetrics: ComparableMetric[] };
type MetricsFixture = { meta: AnalyticsMeta; metrics: ComparableMetric[] };
type PercentileComparisonFixture = { currentMs: number | null; previousMs: number | null; deltaMs: number | null; deltaRate: number | null };
type PerformanceFixture = MetricsFixture & { endpoints: Array<{ p50Comparison: PercentileComparisonFixture; p95Comparison: PercentileComparisonFixture }> };

function expectComparisonDisabled(metrics: ComparableMetric[]) {
  for (const metric of metrics) {
    expect(metric.previousValue).toBeNull();
    expect(metric.delta).toBeNull();
    expect(metric.deltaRate).toBeNull();
  }
}

describe("monitoring detail fixtures", () => {
  it("uses a comparison-enabled meta range whenever response metrics carry a previous period", () => {
    const events = fixtures.detailEnvelopes["/api/analytics/events"].data as EventsFixture;
    const traffic = fixtures.detailEnvelopes["/api/analytics/traffic"].data as MetricsFixture;
    const performance = fixtures.detailEnvelopes["/api/analytics/performance"].data as PerformanceFixture;

    for (const data of [events, traffic, performance]) {
      expect(data.meta.compare).toBe(true);
      expect(data.meta.comparisonFrom).not.toBeNull();
      expect(data.meta.comparisonTo).not.toBeNull();
    }
  });

  it("keeps every comparison field null in the explicit comparison-disabled fixture", () => {
    expect("detailNoComparisonEnvelopes" in fixtures).toBe(true);
    const disabled = (fixtures as typeof fixtures & { detailNoComparisonEnvelopes: typeof fixtures.detailEnvelopes }).detailNoComparisonEnvelopes;
    const events = disabled["/api/analytics/events"].data as EventsFixture;
    const traffic = disabled["/api/analytics/traffic"].data as MetricsFixture;
    const performance = disabled["/api/analytics/performance"].data as PerformanceFixture;

    expect(events.meta.compare).toBe(false);
    expectComparisonDisabled(events.summaryMetrics);
    expectComparisonDisabled(traffic.metrics);
    expectComparisonDisabled(performance.metrics);
    for (const endpoint of performance.endpoints) {
      for (const comparison of [endpoint.p50Comparison, endpoint.p95Comparison]) {
        expect(comparison.currentMs).toBeNull();
        expect(comparison.previousMs).toBeNull();
        expect(comparison.deltaMs).toBeNull();
        expect(comparison.deltaRate).toBeNull();
      }
    }
  });
});
