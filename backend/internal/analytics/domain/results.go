package domain

import "time"

type QueryState string

const (
	QueryReady     QueryState = "ready"
	QueryNoData    QueryState = "no_data"
	QueryNoResults QueryState = "no_results"
)

type Metric struct {
	Key           string   `json:"key"`
	Value         *float64 `json:"value"`
	PreviousValue *float64 `json:"previousValue"`
	Delta         *float64 `json:"delta"`
	DeltaRate     *float64 `json:"deltaRate"`
}

type SeriesPoint struct {
	BucketStart time.Time          `json:"bucketStart"`
	BucketEnd   time.Time          `json:"bucketEnd"`
	Values      map[string]float64 `json:"values"`
}

type DistributionItem struct {
	Key   string   `json:"key"`
	Count int64    `json:"count"`
	Ratio *float64 `json:"ratio"`
}

type FunnelStage struct {
	Key              string   `json:"key"`
	UniqueVisitors   int64    `json:"uniqueVisitors"`
	FromPreviousRate *float64 `json:"fromPreviousRate"`
	FromFirstRate    *float64 `json:"fromFirstRate"`
}

type Funnel struct {
	Key               string        `json:"key"`
	SessionGapMinutes int           `json:"sessionGapMinutes"`
	Stages            []FunnelStage `json:"stages"`
}

type TimeBucket struct {
	Start time.Time
	End   time.Time
}

type TrafficSeriesPoint struct {
	BucketStart             time.Time `json:"bucketStart"`
	BucketEnd               time.Time `json:"bucketEnd"`
	PV                      int64     `json:"pv"`
	UV                      int64     `json:"uv"`
	SuccessfulPlaceVisitors int64     `json:"successfulPlaceVisitors"`
	SuccessfulRouteVisitors int64     `json:"successfulRouteVisitors"`
}

type LatencySummary struct {
	RequestCount int64  `json:"requestCount"`
	P50MS        *int64 `json:"p50Ms"`
	P95MS        *int64 `json:"p95Ms"`
}

type VersionDistribution struct {
	Platform            Platform `json:"platform"`
	VersionName         string   `json:"versionName"`
	VersionCode         int64    `json:"versionCode"`
	RequestCount        int64    `json:"requestCount"`
	SuccessfulResponses int64    `json:"successfulResponses"`
	UV                  int64    `json:"uv"`
	SizeBytes           int64    `json:"sizeBytes"`
}

type LatencyPercentile struct {
	P50 *int64 `json:"p50"`
	P95 *int64 `json:"p95"`
}

type SLISeriesPoint struct {
	BucketStart  time.Time
	BucketEnd    time.Time
	EventType    EventType
	SuccessfulPV int64
	TotalPV      int64
	SuccessRate  *float64
}

type VisitorSummary struct {
	VisitorID    string     `json:"visitorId"`
	FirstSeenAt  time.Time  `json:"firstSeenAt"`
	LastSeenAt   time.Time  `json:"lastSeenAt"`
	EventCount   int64      `json:"eventCount"`
	SessionCount int64      `json:"sessionCount"`
	CommonLocale Locale     `json:"commonLocale"`
	CommonDevice DeviceType `json:"commonDeviceType"`
	CommonSource SourceType `json:"commonSourceType"`
}

type DerivedSession struct {
	Ordinal    int              `json:"ordinal"`
	StartedAt  time.Time        `json:"startedAt"`
	EndedAt    time.Time        `json:"endedAt"`
	DurationMS int64            `json:"durationMs"`
	EventCount int              `json:"eventCount"`
	Events     []AnalyticsEvent `json:"events"`
}

type QueryResult struct {
	State         QueryState
	Metrics       []Metric
	Series        []SeriesPoint
	Distributions map[string][]DistributionItem
	Funnels       []Funnel
	Latency       LatencyPercentile
}
