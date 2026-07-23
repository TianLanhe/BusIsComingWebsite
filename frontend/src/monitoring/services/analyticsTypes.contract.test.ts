import { describe, expect, it } from "vitest";
import type { EventListData, TrafficData } from "./analyticsTypes";

describe("analytics DTO metric keys", () => {
  it("limits event summaries and traffic metrics to their documented key sets", () => {
    const eventMetrics: EventListData["summaryMetrics"] = [{ key: "totalCount", value: 1, previousValue: null, delta: null, deltaRate: null }];
    const trafficMetrics: TrafficData["metrics"] = [{ key: "routeQueryVisitors", value: 1, previousValue: null, delta: null, deltaRate: null }];

    // @ts-expect-error Event summaries cannot silently accept arbitrary dashboard metrics.
    const invalidEventMetrics: EventListData["summaryMetrics"] = [{ key: "pv", value: 1, previousValue: null, delta: null, deltaRate: null }];
    // @ts-expect-error Traffic metrics are constrained even though Metric remains reusable elsewhere.
    const invalidTrafficMetrics: TrafficData["metrics"] = [{ key: "unknownMetric", value: 1, previousValue: null, delta: null, deltaRate: null }];
    // @ts-expect-error Successful visitors belong only to the trend/funnel model, never public traffic cards.
    const legacySuccessfulVisitorMetric: TrafficData["metrics"] = [{ key: "successfulRouteVisitors", value: 1, previousValue: null, delta: null, deltaRate: null }];

    expect(eventMetrics).toHaveLength(1);
    expect(trafficMetrics).toHaveLength(1);
    expect(invalidEventMetrics).toBeDefined();
    expect(invalidTrafficMetrics).toBeDefined();
    expect(legacySuccessfulVisitorMetric).toBeDefined();
  });
});
