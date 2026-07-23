const meta = { from: "2026-06-21T00:00:00+08:00", to: "2026-07-21T00:00:00+08:00", timezone: "Asia/Hong_Kong", granularity: "day", compare: true, comparisonFrom: "2026-05-22T00:00:00+08:00", comparisonTo: "2026-06-21T00:00:00+08:00", appliedFilters: { locale: [], device: [], source: [], outcome: [], platform: [], versionName: [], versionCode: [], eventType: [] }, generatedAt: "2026-07-21T01:16:42Z", state: "ready" };
const noComparisonMeta = { ...meta, compare: false, comparisonFrom: null, comparisonTo: null };
const event = { eventId: "99", occurredAt: "2026-07-21T00:12:00Z", visitorId: "abcdefghijklmnopqrstuv", eventType: "route_query", outcome: "success", httpStatus: 200, statusClass: "2xx", failureCategory: null, durationMs: 420, locale: "zh-Hant", deviceType: "mobile", sourceType: "direct", download: null };
const envelope = <T>(data: T) => ({ requestId: "fixture-details", data, error: null });
const withoutComparison = <T extends { previousValue: number | null; delta: number | null; deltaRate: number | null }>(metric: T) => ({ ...metric, previousValue: null, delta: null, deltaRate: null });
const withoutPercentileComparison = (currentMs: number | null) => ({ currentMs, previousMs: null, deltaMs: null, deltaRate: null });
export const detailEnvelopes = {
  "/api/analytics/events": envelope({ meta, summary: { totalCount: 2, successCount: 2, failureCount: 0, uniqueVisitors: 1 }, summaryMetrics: [
    { key: "totalCount", value: 2, previousValue: 0, delta: 2, deltaRate: null },
    { key: "successCount", value: 2, previousValue: 1, delta: 1, deltaRate: 1 },
    { key: "failureCount", value: 0, previousValue: null, delta: null, deltaRate: null },
    { key: "uniqueVisitors", value: 1, previousValue: 1, delta: 0, deltaRate: 0 },
  ], items: [event, { ...event, eventId: "98", eventType: "place_query", durationMs: 180 }], pageInfo: { limit: 50, nextCursor: null, hasMore: false, totalCount: 2 } }),
  "/api/analytics/visitor": envelope({ generatedAt: meta.generatedAt, timezone: "Asia/Hong_Kong", visitor: { visitorId: event.visitorId, firstSeenAt: meta.from, lastSeenAt: meta.to, eventCount: 2, sessionCount: 1, commonLocale: "zh-Hant", commonDeviceType: "mobile", commonSourceType: "direct", eventComposition: [{ key: "route_query", count: 1, ratio: .5 }, { key: "place_query", count: 1, ratio: .5 }], commonPlatform: null }, sessions: [{ ordinal: 1, startedAt: meta.from, endedAt: meta.to, durationMs: 420, eventCount: 2, events: [event] }], pageInfo: { limit: 50, nextCursor: null, hasMore: false, totalCount: 2 } }),
  "/api/analytics/traffic": envelope({
    meta,
    metrics: [
      { key: "pv", value: 1200, previousValue: null, delta: null, deltaRate: null },
      { key: "uv", value: 420, previousValue: null, delta: null, deltaRate: null },
      { key: "placeQueryRequests", value: 280, previousValue: 0, delta: 280, deltaRate: null },
      { key: "placeQueryVisitors", value: 260, previousValue: null, delta: null, deltaRate: null },
      { key: "routeQueryRequests", value: 200, previousValue: 180, delta: 20, deltaRate: .111 },
      { key: "routeQueryVisitors", value: 180, previousValue: 180, delta: 0, deltaRate: 0 },
    ],
    series: Array.from({ length: 12 }, (_, index) => ({
      bucketStart: `2026-07-${String(index + 9).padStart(2, "0")}T00:00:00+08:00`,
      bucketEnd: `2026-07-${String(index + 10).padStart(2, "0")}T00:00:00+08:00`,
      pv: 90 + index * 7, uv: 35 + index * 3, successfulPlaceVisitors: 24 + index * 2, successfulRouteVisitors: 12 + index,
    })),
    trialFunnel: { key: "trial", sessionGapMinutes: 30, stages: [{ key: "homepage", uniqueVisitors: 420, fromPreviousRate: null, fromFirstRate: null }, { key: "successful_place_query", uniqueVisitors: 260, fromPreviousRate: .62, fromFirstRate: .62 }, { key: "successful_route_query", uniqueVisitors: 180, fromPreviousRate: .69, fromFirstRate: .43 }] },
    heatmap: Array.from({ length: 30 }, (_, index) => { const localDate = `2026-07-${String(index + 1).padStart(2, "0")}`; return { localDate, bucketStart: `${localDate}T00:00:00+08:00`, bucketEnd: `${localDate}T23:59:59+08:00`, eventCount: index * 3, uv: index }; }),
    locales: [], devices: [], sources: [],
  }),
  "/api/analytics/downloads": envelope({ meta, metrics: [], series: [], downloadFunnel: { key: "download", sessionGapMinutes: 30, stages: [] }, platforms: [], versions: [], failures: [] }),
  "/api/analytics/performance": envelope({
    meta,
    metrics: [
      { key: "requestCount", value: 720, previousValue: 680, delta: 40, deltaRate: .0588 },
      { key: "requestSuccessRate", value: .972, previousValue: .965, delta: .007, deltaRate: .0073 },
      { key: "p50Ms", value: 128, previousValue: 135, delta: -7, deltaRate: -.0519 },
      { key: "p95Ms", value: 480, previousValue: 510, delta: -30, deltaRate: -.0588 },
    ],
    endpoints: [
      { operationId: "getLatestAndroidApkMetadata", eventType: "page_view", requestCount: 320, successRate: .99, p50Ms: 42, p50Comparison: { currentMs: 42, previousMs: 40, deltaMs: 2, deltaRate: .05 }, p95Ms: 88, p95Comparison: { currentMs: 88, previousMs: 90, deltaMs: -2, deltaRate: -.022 } },
      { operationId: "queryRoutePlaces", eventType: "place_query", requestCount: 180, successRate: .97, p50Ms: 130, p50Comparison: { currentMs: 130, previousMs: 0, deltaMs: 130, deltaRate: null }, p95Ms: 390, p95Comparison: { currentMs: 390, previousMs: null, deltaMs: null, deltaRate: null } },
      { operationId: "queryRouteOptions", eventType: "route_query", requestCount: 160, successRate: .95, p50Ms: 220, p50Comparison: { currentMs: 220, previousMs: 260, deltaMs: -40, deltaRate: -.154 }, p95Ms: 680, p95Comparison: { currentMs: 680, previousMs: 720, deltaMs: -40, deltaRate: -.056 } },
      { operationId: "downloadLatestAndroidApk", eventType: "download_request", requestCount: 60, successRate: .98, p50Ms: null, p50Comparison: { currentMs: null, previousMs: 95, deltaMs: null, deltaRate: null }, p95Ms: null, p95Comparison: { currentMs: null, previousMs: null, deltaMs: null, deltaRate: null } },
    ],
    latencySeries: Array.from({ length: 8 }, (_, index) => ["page_view", "place_query", "route_query", "download_request"].map((eventType, typeIndex) => ({ bucketStart: `2026-07-${String(index + 13).padStart(2, "0")}T00:00:00+08:00`, bucketEnd: `2026-07-${String(index + 14).padStart(2, "0")}T00:00:00+08:00`, eventType, requestCount: 20 + index, p50Ms: 50 + typeIndex * 45 + index * 3, p95Ms: 100 + typeIndex * 130 + index * 9 }))).flat(),
    sliSeries: Array.from({ length: 8 }, (_, index) => ["page_view", "place_query", "route_query", "download_request"].map((eventType, typeIndex) => {
      const totalPV = index === 2 && typeIndex === 3 ? 0 : 20 + index;
      const successfulPV = typeIndex === 1 && index === 4 ? 0 : totalPV - typeIndex;
      return { bucketStart: `2026-07-${String(index + 13).padStart(2, "0")}T00:00:00+08:00`, bucketEnd: `2026-07-${String(index + 14).padStart(2, "0")}T00:00:00+08:00`, eventType, successfulPV, totalPV, successRate: totalPV === 0 ? null : successfulPV / totalPV };
    })).flat(),
    failures: [{ key: "external_timeout", count: 11, ratio: .55 }, { key: "external_unavailable", count: 6, ratio: .3 }, { key: "invalid_request", count: 3, ratio: .15 }],
  }),
  "/api/analytics/system": envelope({ generatedAt: meta.generatedAt, database: { state: "available", rowCount: 2, todayLocalDate: "2026-07-21", todayRowCount: null, sizeBytes: 4096, lastSuccessfulWriteAt: meta.generatedAt }, sqlite: { version: "3.50.4", journalMode: "wal", schemaVersion: "001" }, process: { startedAt: meta.from, uptimeMs: null, droppedSinceStart: 0 }, privateListener: { state: "available", bindAddress: "127.0.0.1:18081", publicProxy: false } }),
};

export const detailNoComparisonEnvelopes = {
  "/api/analytics/events": envelope({ ...detailEnvelopes["/api/analytics/events"].data, meta: noComparisonMeta, summaryMetrics: detailEnvelopes["/api/analytics/events"].data.summaryMetrics.map(withoutComparison) }),
  "/api/analytics/traffic": envelope({ ...detailEnvelopes["/api/analytics/traffic"].data, meta: noComparisonMeta, metrics: detailEnvelopes["/api/analytics/traffic"].data.metrics.map(withoutComparison) }),
  // compare=false 只移除上一期与变化；当前分位仍反映当前 operation 是否有样本。
  "/api/analytics/performance": envelope({ ...detailEnvelopes["/api/analytics/performance"].data, meta: noComparisonMeta, metrics: detailEnvelopes["/api/analytics/performance"].data.metrics.map(withoutComparison), endpoints: detailEnvelopes["/api/analytics/performance"].data.endpoints.map((endpoint) => ({ ...endpoint, p50Comparison: withoutPercentileComparison(endpoint.p50Ms), p95Comparison: withoutPercentileComparison(endpoint.p95Ms) })) }),
};

export const systemFailureEnvelope = {
  requestId: "fixture-system-failure",
  data: null,
  error: { code: "ANALYTICS_QUERY_FAILED", message: "监控查询暂时失败" },
};
