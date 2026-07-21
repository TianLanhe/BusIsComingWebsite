package application

import (
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

type EventPage struct {
	Events     []domain.AnalyticsEvent
	NextCursor string
}

type VisitorQuery struct {
	VisitorID string
	Range     domain.AnalyticsQuery
}

type VisitorResult struct {
	Summary  domain.VisitorSummary
	Sessions []domain.DerivedSession
	Events   EventPage
}

type SystemStorageSnapshot struct {
	DatabaseRowCount  *int64
	DatabaseSizeBytes *int64
}

type SystemStatus struct {
	DatabaseState         DatabaseState
	DatabaseRowCount      *int64
	DatabaseSizeBytes     *int64
	LastSuccessfulWriteAt *time.Time
	DroppedSinceStart     uint64
	ProcessStartedAt      time.Time
	PrivateListenerState  string
}

type AppliedFilters struct {
	Locales      []domain.Locale     `json:"locale"`
	Devices      []domain.DeviceType `json:"device"`
	Sources      []domain.SourceType `json:"source"`
	Outcomes     []domain.Outcome    `json:"outcome"`
	Platforms    []domain.Platform   `json:"platform"`
	VersionNames []string            `json:"versionName"`
	VersionCodes []int64             `json:"versionCode"`
	EventTypes   []domain.EventType  `json:"eventType"`
}

type AnalyticsMeta struct {
	From           time.Time          `json:"from"`
	To             time.Time          `json:"to"`
	Timezone       string             `json:"timezone"`
	Granularity    domain.Granularity `json:"granularity"`
	Compare        bool               `json:"compare"`
	ComparisonFrom *time.Time         `json:"comparisonFrom"`
	ComparisonTo   *time.Time         `json:"comparisonTo"`
	AppliedFilters AppliedFilters     `json:"appliedFilters"`
	GeneratedAt    time.Time          `json:"generatedAt"`
	State          domain.QueryState  `json:"state"`
}

type OverviewData struct {
	Meta              AnalyticsMeta                `json:"meta"`
	Metrics           []domain.Metric              `json:"metrics"`
	TrafficSeries     []domain.TrafficSeriesPoint  `json:"trafficSeries"`
	TrialFunnel       domain.Funnel                `json:"trialFunnel"`
	DownloadFunnel    domain.Funnel                `json:"downloadFunnel"`
	EventComposition  []domain.DistributionItem    `json:"eventComposition"`
	Latency           domain.LatencySummary        `json:"latency"`
	DownloadPlatforms []domain.DistributionItem    `json:"downloadPlatforms"`
	DownloadVersions  []domain.VersionDistribution `json:"downloadVersions"`
}
