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
}

export interface AppliedFilters extends Omit<AnalyticsQuery, "from" | "to" | "granularity" | "compare"> {
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
  downloadPlatforms: DistributionPoint[];
  downloadVersions: VersionDistribution[];
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
