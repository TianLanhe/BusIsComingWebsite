package application

import (
	"context"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

type EventWriter interface {
	WriteEvent(context.Context, domain.AnalyticsEvent) error
}

type Clock interface {
	Now() time.Time
}

type ClockFunc func() time.Time

func (clock ClockFunc) Now() time.Time { return clock() }

type AnalyticsQueryStore interface {
	QueryOverview(context.Context, domain.AnalyticsQuery) (domain.QueryResult, error)
	QueryTraffic(context.Context, domain.AnalyticsQuery) (domain.QueryResult, error)
	QueryDownloads(context.Context, domain.AnalyticsQuery) (domain.QueryResult, error)
	QueryEvents(context.Context, domain.AnalyticsQuery) (EventPage, error)
	QueryVisitor(context.Context, VisitorQuery) (VisitorResult, error)
	QueryPerformance(context.Context, domain.AnalyticsQuery) (domain.QueryResult, error)
	QuerySystem(context.Context) (SystemStorageSnapshot, error)
}

type RuntimeHealthReader interface {
	Snapshot() RuntimeHealthSnapshot
}
