export type AnalyticsLocale = "zh-Hant" | "zh-Hans" | "en" | "unknown";
export type DeviceType = "desktop" | "mobile" | "tablet" | "other";
export type SourceType = "direct" | "search" | "referral" | "internal" | "unknown";
export type Outcome = "success" | "failure";
export type Platform = "android" | "ios" | "other";
export type EventType = "page_view" | "place_query" | "route_query" | "download_request";
export type Granularity = "hour" | "day" | "week" | "month";
export type QueryState = "ready" | "no_data" | "no_results";

export interface AnalyticsQuery {
  from: string;
  to: string;
  granularity: Granularity;
  compare: boolean;
  locale: AnalyticsLocale[];
  device: DeviceType[];
  source: SourceType[];
  outcome: Outcome[];
  platform: Platform[];
  versionName: string[];
  versionCode: number[];
  eventType?: EventType[];
  limit?: number;
  cursor?: string;
}

export interface AppliedFilters {
  locale: AnalyticsLocale[];
  device: DeviceType[];
  source: SourceType[];
  outcome: Outcome[];
  platform: Platform[];
  versionName: string[];
  versionCode: number[];
  eventType: EventType[];
}

export interface AnalyticsMeta {
  from: string;
  to: string;
  timezone: "Asia/Hong_Kong";
  granularity: Granularity;
  compare: boolean;
  comparisonFrom: string | null;
  comparisonTo: string | null;
  appliedFilters: AppliedFilters;
  generatedAt: string;
  state: QueryState;
}

export interface Metric {
  key: string;
  value: number | null;
  previousValue: number | null;
  delta: number | null;
  deltaRate: number | null;
}

export type TrafficMetricKey = "pv" | "uv" | "placeQueryRequests" | "placeQueryVisitors" | "routeQueryRequests" | "routeQueryVisitors";
export type EventSummaryMetricKey = "totalCount" | "successCount" | "failureCount" | "uniqueVisitors";

export interface TrafficSeriesPoint {
  bucketStart: string;
  bucketEnd: string;
  pv: number;
  uv: number;
  successfulPlaceVisitors: number;
  successfulRouteVisitors: number;
}

export interface FunnelStage {
  key: "homepage" | "successful_place_query" | "successful_route_query" | "successful_download_response";
  uniqueVisitors: number;
  fromPreviousRate: number | null;
  fromFirstRate: number | null;
}

export interface Funnel {
  key: "trial" | "download";
  sessionGapMinutes: 30;
  stages: FunnelStage[];
}

export interface DistributionPoint {
  key: string;
  count: number;
  ratio: number | null;
}

export interface VersionDistribution {
  platform: Platform;
  versionName: string;
  versionCode: number;
  requestCount: number;
  successfulResponses: number;
  uv: number;
  sizeBytes: number;
}

export interface OverviewData {
  meta: AnalyticsMeta;
  metrics: Metric[];
  trafficSeries: TrafficSeriesPoint[];
  trialFunnel: Funnel;
  downloadFunnel: Funnel;
  eventComposition: DistributionPoint[];
  latency: { requestCount: number; p50Ms: number | null; p95Ms: number | null };
  latencyByEvent: EventLatencySummary[];
  downloadPlatforms: DistributionPoint[];
  downloadVersions: VersionDistribution[];
}

export interface EventLatencySummary {
  eventType: EventType;
  requestCount: number;
  p95Ms: number | null;
}

export interface AnalyticsErrorBody {
  code: "ANALYTICS_INVALID_FILTER" | "ANALYTICS_INVALID_CURSOR" | "ANALYTICS_VISITOR_NOT_FOUND" | "ANALYTICS_STORAGE_UNAVAILABLE" | "ANALYTICS_QUERY_FAILED";
  message: string;
}

export interface AnalyticsEnvelope<T> {
  requestId: string;
  data: T | null;
  error: AnalyticsErrorBody | null;
}

export interface HeatmapCell { localDate: string; bucketStart: string; bucketEnd: string; eventCount: number; uv: number }
export interface DownloadSeriesPoint { bucketStart: string; bucketEnd: string; requests: number; successfulResponses: number; uv: number }
export interface TrafficData { meta: AnalyticsMeta; metrics: Metric[]; series: TrafficSeriesPoint[]; trialFunnel: Funnel; heatmap: HeatmapCell[]; locales: DistributionPoint[]; devices: DistributionPoint[]; sources: DistributionPoint[] }
export interface DownloadsData { meta: AnalyticsMeta; metrics: Metric[]; series: DownloadSeriesPoint[]; downloadFunnel: Funnel; platforms: DistributionPoint[]; versions: VersionDistribution[]; failures: DistributionPoint[] }
export type StatusClass = "2xx" | "3xx" | "4xx" | "5xx" | "aborted" | "unknown";
export interface EventDetail { eventId: string; occurredAt: string; visitorId: string; eventType: EventType; outcome: Outcome; httpStatus: number | null; statusClass: StatusClass; failureCategory: string | null; durationMs: number; locale: AnalyticsLocale; deviceType: DeviceType; sourceType: SourceType; download: { platform: Platform; versionName: string | null; versionCode: number | null; sizeBytes: number | null } | null }
export interface PageInfo { limit: number; nextCursor: string | null; hasMore: boolean; totalCount: number }
export interface EventRangeSummary { totalCount: number; successCount: number; failureCount: number; uniqueVisitors: number }
export interface EventListData { meta: AnalyticsMeta; summary: EventRangeSummary; summaryMetrics: Metric[]; items: EventDetail[]; pageInfo: PageInfo }
export interface VisitorSummary { visitorId: string; firstSeenAt: string; lastSeenAt: string; eventCount: number; sessionCount: number; commonLocale: AnalyticsLocale; commonDeviceType: DeviceType; commonSourceType: SourceType; eventComposition: DistributionPoint[]; commonPlatform: Platform | null }
export interface DerivedSession { ordinal: number; startedAt: string; endedAt: string; durationMs: number; eventCount: number; events: EventDetail[] }
export interface VisitorData { generatedAt: string; timezone: "Asia/Hong_Kong"; visitor: VisitorSummary; sessions: DerivedSession[]; pageInfo: PageInfo }
export interface PercentileComparison { currentMs: number | null; previousMs: number | null; deltaMs: number | null; deltaRate: number | null }
export interface EndpointPerformance { operationId: "getLatestAndroidApkMetadata" | "queryRoutePlaces" | "queryRouteOptions" | "downloadLatestAndroidApk"; eventType: EventType; requestCount: number; successRate: number | null; p50Ms: number | null; p50Comparison: PercentileComparison; p95Ms: number | null; p95Comparison: PercentileComparison }
export interface LatencySeriesPoint { bucketStart: string; bucketEnd: string; eventType: EventType; requestCount: number; p50Ms: number | null; p95Ms: number | null }
export interface SLISeriesPoint { bucketStart: string; bucketEnd: string; eventType: EventType; successfulPV: number; totalPV: number; successRate: number | null }
export interface PerformanceData { meta: AnalyticsMeta; metrics: Metric[]; endpoints: EndpointPerformance[]; latencySeries: LatencySeriesPoint[]; sliSeries: SLISeriesPoint[]; failures: DistributionPoint[] }
export interface SystemData {
  generatedAt: string;
  database: { state: "available" | "degraded" | "unavailable"; rowCount: number | null; todayLocalDate: string; todayRowCount: number | null; sizeBytes: number | null; lastSuccessfulWriteAt: string | null };
  sqlite: { version: string | null; journalMode: "delete" | "truncate" | "persist" | "memory" | "wal" | "off" | null; schemaVersion: string | null };
  process: { startedAt: string | null; uptimeMs: number | null; droppedSinceStart: number | null };
  privateListener: { state: "starting" | "available" | "unavailable" | "stopped" | null; bindAddress: string | null; publicProxy: false };
}
