package http

import (
	"context"

	"busiscoming-website/backend/internal/analytics/domain"
)

type EventRecorder interface {
	Record(context.Context, domain.AnalyticsEvent)
}
