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
	Key   string  `json:"key"`
	Count int64   `json:"count"`
	Rate  float64 `json:"rate"`
}

type FunnelStage struct {
	Key              string   `json:"key"`
	UniqueVisitors   int64    `json:"uniqueVisitors"`
	FromPreviousRate *float64 `json:"fromPreviousRate"`
	FromFirstRate    *float64 `json:"fromFirstRate"`
}

type Funnel struct {
	Key    string        `json:"key"`
	Stages []FunnelStage `json:"stages"`
}

type LatencyPercentile struct {
	P50 *int64 `json:"p50"`
	P95 *int64 `json:"p95"`
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
