import { describe, expect, it } from "vitest";
import type { EventListData, TrafficData } from "./analyticsTypes";

describe("analytics DTO metric keys", () => {
  it("limits event summaries and traffic metrics to their documented key sets", () => {
    const eventMetrics: EventListData["summaryMetrics"] = [{ key: "totalCount", value: 1, previousValue: null, delta: null, deltaRate: null }];
    const trafficMetrics: TrafficData["metrics"] = [{ key: "routeQueryVisitors", value: 1, previousValue: null, delta: null, deltaRate: null }];

    // @ts-expect-error 事件摘要不能静默接受任意 Dashboard 指标。
    const invalidEventMetrics: EventListData["summaryMetrics"] = [{ key: "pv", value: 1, previousValue: null, delta: null, deltaRate: null }];
    // @ts-expect-error 流量指标受限，尽管 Metric 可在其他位置复用。
    const invalidTrafficMetrics: TrafficData["metrics"] = [{ key: "unknownMetric", value: 1, previousValue: null, delta: null, deltaRate: null }];
    // @ts-expect-error 成功访客只属于趋势/漏斗模型，不属于公开流量卡。
    const legacySuccessfulVisitorMetric: TrafficData["metrics"] = [{ key: "successfulRouteVisitors", value: 1, previousValue: null, delta: null, deltaRate: null }];

    expect(eventMetrics).toHaveLength(1);
    expect(trafficMetrics).toHaveLength(1);
    expect(invalidEventMetrics).toBeDefined();
    expect(invalidTrafficMetrics).toBeDefined();
    expect(legacySuccessfulVisitorMetric).toBeDefined();
  });
});
