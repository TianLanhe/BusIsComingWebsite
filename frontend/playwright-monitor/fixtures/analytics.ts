export const overviewEnvelope = {
  requestId: "req-overview-fixture",
  data: {
    meta: {
      from: "2026-06-21T00:00:00+08:00", to: "2026-07-21T00:00:00+08:00", timezone: "Asia/Hong_Kong", granularity: "day", compare: true,
      comparisonFrom: "2026-05-22T00:00:00+08:00", comparisonTo: "2026-06-21T00:00:00+08:00",
      appliedFilters: { locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [], eventType: [] },
      generatedAt: "2026-07-21T01:16:42Z", state: "ready",
    },
    metrics: [
      { key: "pv", value: 12480, previousValue: 11083, delta: 1397, deltaRate: .126 },
      { key: "uv", value: 3216, previousValue: 2967, delta: 249, deltaRate: .084 },
      { key: "viewsPerVisitor", value: 3.88, previousValue: 3.73, delta: .15, deltaRate: .04 },
      { key: "successfulRouteQueries", value: 846, previousValue: 791, delta: 55, deltaRate: .069 },
      { key: "downloadRequests", value: 318, previousValue: 269, delta: 49, deltaRate: .182 },
      { key: "requestSuccessRate", value: .982, previousValue: .986, delta: -.004, deltaRate: -.004 },
    ],
    trafficSeries: Array.from({ length: 12 }, (_, index) => ({
      bucketStart: `2026-07-${String(index + 9).padStart(2, "0")}T00:00:00+08:00`,
      bucketEnd: `2026-07-${String(index + 10).padStart(2, "0")}T00:00:00+08:00`,
      pv: 320 + index * 18 + (index % 3) * 20, uv: 96 + index * 8, successfulPlaceVisitors: 72 + index * 5, successfulRouteVisitors: 42 + index * 3,
    })),
    trialFunnel: { key: "trial", sessionGapMinutes: 30, stages: [{ key: "homepage", uniqueVisitors: 3216, fromPreviousRate: null, fromFirstRate: null }, { key: "successful_place_query", uniqueVisitors: 2444, fromPreviousRate: .76, fromFirstRate: .76 }, { key: "successful_route_query", uniqueVisitors: 1564, fromPreviousRate: .64, fromFirstRate: .486 }] },
    downloadFunnel: { key: "download", sessionGapMinutes: 30, stages: [{ key: "homepage", uniqueVisitors: 3216, fromPreviousRate: null, fromFirstRate: null }, { key: "successful_download_response", uniqueVisitors: 692, fromPreviousRate: .215, fromFirstRate: .215 }] },
    eventComposition: [{ key: "page_view", count: 12480, ratio: .44 }, { key: "place_query", count: 5906, ratio: .32 }, { key: "route_query", count: 2674, ratio: .15 }, { key: "download_request", count: 1682, ratio: .09 }],
    latency: { requestCount: 22742, p50Ms: 28, p95Ms: 640 },
    latencyByEvent: [
      { eventType: "page_view", requestCount: 12480, p95Ms: 42 },
      { eventType: "place_query", requestCount: 5906, p95Ms: 310 },
      { eventType: "route_query", requestCount: 2674, p95Ms: 640 },
      { eventType: "download_request", requestCount: 1682, p95Ms: 95 },
    ],
    downloadPlatforms: [{ key: "android", count: 318, ratio: 1 }],
    downloadVersions: [{ platform: "android", versionName: "1.0", versionCode: 1, requestCount: 318, successfulResponses: 315, uv: 292, sizeBytes: 20_000_000 }],
  },
  error: null,
};

export const overviewWithoutComparisonEnvelope = {
  ...overviewEnvelope,
  requestId: "req-overview-no-comparison",
  data: {
    ...overviewEnvelope.data,
    metrics: overviewEnvelope.data.metrics.map((metric) => ({
      ...metric,
      previousValue: null,
      delta: null,
      deltaRate: null,
    })),
    latencyByEvent: overviewEnvelope.data.latencyByEvent.map((item, index) =>
      index === 2 ? { ...item, requestCount: 0, p95Ms: null } : item),
  },
};
