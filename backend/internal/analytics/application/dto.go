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
