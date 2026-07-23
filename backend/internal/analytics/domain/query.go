package domain

import "time"

type Granularity string

const (
	GranularityHour  Granularity = "hour"
	GranularityDay   Granularity = "day"
	GranularityWeek  Granularity = "week"
	GranularityMonth Granularity = "month"
)

type AnalyticsQuery struct {
	From         time.Time
	To           time.Time
	Granularity  Granularity
	Compare      bool
	Locales      []Locale
	DeviceTypes  []DeviceType
	SourceTypes  []SourceType
	Outcomes     []Outcome
	Platforms    []Platform
	VersionNames []string
	VersionCodes []int64
	EventTypes   []EventType
	Limit        int
	Cursor       string
}

func (query AnalyticsQuery) Validate() error {
	if query.From.IsZero() || query.To.IsZero() || !query.To.After(query.From) {
		return invalid("range", "invalid")
	}
	if query.Granularity != GranularityHour && query.Granularity != GranularityDay && query.Granularity != GranularityWeek && query.Granularity != GranularityMonth {
		return invalid("granularity", "unsupported")
	}
	if query.Limit != 0 && (query.Limit < 1 || query.Limit > 100) {
		return invalid("limit", "out_of_range")
	}
	for _, value := range query.Locales {
		if !IsLocale(value) {
			return invalid("locale", "unsupported")
		}
	}
	for _, value := range query.DeviceTypes {
		if !IsDeviceType(value) {
			return invalid("device", "unsupported")
		}
	}
	for _, value := range query.SourceTypes {
		if !IsSourceType(value) {
			return invalid("source", "unsupported")
		}
	}
	for _, value := range query.Outcomes {
		if !IsOutcome(value) {
			return invalid("outcome", "unsupported")
		}
	}
	for _, value := range query.Platforms {
		if !IsPlatform(value) {
			return invalid("platform", "unsupported")
		}
	}
	for _, value := range query.EventTypes {
		if !IsEventType(value) {
			return invalid("eventType", "unsupported")
		}
	}
	for _, value := range query.VersionNames {
		if value == "" || len(value) > 64 {
			return invalid("versionName", "invalid")
		}
	}
	for _, value := range query.VersionCodes {
		if value <= 0 {
			return invalid("versionCode", "invalid")
		}
	}
	return nil
}

type EventCursor struct {
	OccurredAt time.Time
	EventID    int64
}

type AppliedFilters struct {
	Locales      []Locale     `json:"locale,omitempty"`
	DeviceTypes  []DeviceType `json:"deviceType,omitempty"`
	SourceTypes  []SourceType `json:"sourceType,omitempty"`
	Outcomes     []Outcome    `json:"outcome,omitempty"`
	Platforms    []Platform   `json:"platform,omitempty"`
	VersionNames []string     `json:"versionName,omitempty"`
	VersionCodes []int64      `json:"versionCode,omitempty"`
	EventTypes   []EventType  `json:"eventType,omitempty"`
}
