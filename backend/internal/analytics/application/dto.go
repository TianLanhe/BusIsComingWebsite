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

type HeatmapCell struct {
	LocalDate   string    `json:"localDate"`
	BucketStart time.Time `json:"bucketStart"`
	BucketEnd   time.Time `json:"bucketEnd"`
	EventCount  int64     `json:"eventCount"`
	UV          int64     `json:"uv"`
}

type EventLatencySummary struct {
	EventType    domain.EventType `json:"eventType"`
	RequestCount int64            `json:"requestCount"`
	P95MS        *int64           `json:"p95Ms"`
}

type DownloadSeriesPoint struct {
	BucketStart         time.Time `json:"bucketStart"`
	BucketEnd           time.Time `json:"bucketEnd"`
	Requests            int64     `json:"requests"`
	SuccessfulResponses int64     `json:"successfulResponses"`
	UV                  int64     `json:"uv"`
}

type TrafficData struct {
	Meta        AnalyticsMeta               `json:"meta"`
	Metrics     []domain.Metric             `json:"metrics"`
	Series      []domain.TrafficSeriesPoint `json:"series"`
	TrialFunnel domain.Funnel               `json:"trialFunnel"`
	Heatmap     []HeatmapCell               `json:"heatmap"`
	Locales     []domain.DistributionItem   `json:"locales"`
	Devices     []domain.DistributionItem   `json:"devices"`
	Sources     []domain.DistributionItem   `json:"sources"`
}

type DownloadsData struct {
	Meta           AnalyticsMeta                `json:"meta"`
	Metrics        []domain.Metric              `json:"metrics"`
	Series         []DownloadSeriesPoint        `json:"series"`
	DownloadFunnel domain.Funnel                `json:"downloadFunnel"`
	Platforms      []domain.DistributionItem    `json:"platforms"`
	Versions       []domain.VersionDistribution `json:"versions"`
	Failures       []domain.DistributionItem    `json:"failures"`
}

type EventDetail struct {
	EventID         string                      `json:"eventId"`
	OccurredAt      time.Time                   `json:"occurredAt"`
	VisitorID       string                      `json:"visitorId"`
	EventType       domain.EventType            `json:"eventType"`
	Outcome         domain.Outcome              `json:"outcome"`
	HTTPStatus      *int                        `json:"httpStatus"`
	StatusClass     domain.StatusClass          `json:"statusClass"`
	FailureCategory *domain.FailureCategory     `json:"failureCategory"`
	DurationMS      int64                       `json:"durationMs"`
	Locale          domain.Locale               `json:"locale"`
	DeviceType      domain.DeviceType           `json:"deviceType"`
	SourceType      domain.SourceType           `json:"sourceType"`
	Download        *domain.DownloadAttribution `json:"download"`
}

type PageInfo struct {
	Limit      int     `json:"limit"`
	NextCursor *string `json:"nextCursor"`
	HasMore    bool    `json:"hasMore"`
	TotalCount int64   `json:"totalCount"`
}

type EventRangeSummary struct {
	TotalCount     int64 `json:"totalCount"`
	SuccessCount   int64 `json:"successCount"`
	FailureCount   int64 `json:"failureCount"`
	UniqueVisitors int64 `json:"uniqueVisitors"`
}

type EventListData struct {
	Meta     AnalyticsMeta     `json:"meta"`
	Summary  EventRangeSummary `json:"summary"`
	Items    []EventDetail     `json:"items"`
	PageInfo PageInfo          `json:"pageInfo"`
}

type VisitorSummaryData struct {
	VisitorID        string                    `json:"visitorId"`
	FirstSeenAt      time.Time                 `json:"firstSeenAt"`
	LastSeenAt       time.Time                 `json:"lastSeenAt"`
	EventCount       int64                     `json:"eventCount"`
	SessionCount     int64                     `json:"sessionCount"`
	CommonLocale     domain.Locale             `json:"commonLocale"`
	CommonDeviceType domain.DeviceType         `json:"commonDeviceType"`
	CommonSourceType domain.SourceType         `json:"commonSourceType"`
	EventComposition []domain.DistributionItem `json:"eventComposition"`
	CommonPlatform   *domain.Platform          `json:"commonPlatform"`
}

type SessionDetail struct {
	Ordinal    int           `json:"ordinal"`
	StartedAt  time.Time     `json:"startedAt"`
	EndedAt    time.Time     `json:"endedAt"`
	DurationMS int64         `json:"durationMs"`
	EventCount int           `json:"eventCount"`
	Events     []EventDetail `json:"events"`
}

type VisitorData struct {
	GeneratedAt time.Time          `json:"generatedAt"`
	Timezone    string             `json:"timezone"`
	Visitor     VisitorSummaryData `json:"visitor"`
	Sessions    []SessionDetail    `json:"sessions"`
	PageInfo    PageInfo           `json:"pageInfo"`
}

type EndpointPerformance struct {
	OperationID   string               `json:"operationId"`
	EventType     domain.EventType     `json:"eventType"`
	RequestCount  int64                `json:"requestCount"`
	SuccessRate   *float64             `json:"successRate"`
	P50MS         *int64               `json:"p50Ms"`
	P95MS         *int64               `json:"p95Ms"`
	P50Comparison PercentileComparison `json:"p50Comparison"`
	P95Comparison PercentileComparison `json:"p95Comparison"`
}

type PercentileComparison struct {
	CurrentMS  *int64   `json:"currentMs"`
	PreviousMS *int64   `json:"previousMs"`
	DeltaMS    *int64   `json:"deltaMs"`
	DeltaRate  *float64 `json:"deltaRate"`
}

type SLISeriesPoint struct {
	BucketStart  time.Time        `json:"bucketStart"`
	BucketEnd    time.Time        `json:"bucketEnd"`
	EventType    domain.EventType `json:"eventType"`
	SuccessfulPV int64            `json:"successfulPV"`
	TotalPV      int64            `json:"totalPV"`
	SuccessRate  *float64         `json:"successRate"`
}

type LatencySeriesPoint struct {
	BucketStart  time.Time        `json:"bucketStart"`
	BucketEnd    time.Time        `json:"bucketEnd"`
	EventType    domain.EventType `json:"eventType"`
	RequestCount int64            `json:"requestCount"`
	P50MS        *int64           `json:"p50Ms"`
	P95MS        *int64           `json:"p95Ms"`
}

type PerformanceData struct {
	Meta          AnalyticsMeta             `json:"meta"`
	Metrics       []domain.Metric           `json:"metrics"`
	Endpoints     []EndpointPerformance     `json:"endpoints"`
	LatencySeries []LatencySeriesPoint      `json:"latencySeries"`
	SLISeries     []SLISeriesPoint          `json:"sliSeries"`
	Failures      []domain.DistributionItem `json:"failures"`
}

type DatabaseStatus struct {
	State                 DatabaseState `json:"state"`
	RowCount              *int64        `json:"rowCount"`
	SizeBytes             *int64        `json:"sizeBytes"`
	LastSuccessfulWriteAt *time.Time    `json:"lastSuccessfulWriteAt"`
}

type ProcessStatus struct {
	StartedAt         time.Time `json:"startedAt"`
	DroppedSinceStart uint64    `json:"droppedSinceStart"`
}

type PrivateListenerStatus struct {
	State       string `json:"state"`
	BindAddress string `json:"bindAddress"`
	PublicProxy bool   `json:"publicProxy"`
}

type SystemData struct {
	GeneratedAt     time.Time             `json:"generatedAt"`
	Database        DatabaseStatus        `json:"database"`
	Process         ProcessStatus         `json:"process"`
	PrivateListener PrivateListenerStatus `json:"privateListener"`
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
	LatencyByEvent    []EventLatencySummary        `json:"latencyByEvent"`
	DownloadPlatforms []domain.DistributionItem    `json:"downloadPlatforms"`
	DownloadVersions  []domain.VersionDistribution `json:"downloadVersions"`
}
