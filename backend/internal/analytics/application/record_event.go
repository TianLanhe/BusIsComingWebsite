package application

import (
	"context"
	"errors"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

const (
	DefaultWriteTimeout = 50 * time.Millisecond
	MaximumWriteTimeout = 200 * time.Millisecond
)

type RecordEvent struct {
	writer  EventWriter
	timeout time.Duration
	health  *RuntimeHealth
	clock   Clock
}

func NewRecordEvent(writer EventWriter, timeout time.Duration, health *RuntimeHealth) *RecordEvent {
	return NewRecordEventWithClock(writer, timeout, health, ClockFunc(time.Now))
}

func NewRecordEventWithClock(writer EventWriter, timeout time.Duration, health *RuntimeHealth, clock Clock) *RecordEvent {
	if timeout > MaximumWriteTimeout {
		timeout = MaximumWriteTimeout
	}
	return &RecordEvent{writer: writer, timeout: timeout, health: health, clock: clock}
}

// Record owns a short, detached deadline. Public request cancellation therefore
// cannot skip the single best-effort write, while a blocked store can never hold the
// response path beyond the configured upper bound.
func (recorder *RecordEvent) Record(parent context.Context, event domain.AnalyticsEvent) {
	base := context.WithoutCancel(parent)
	ctx, cancel := context.WithTimeout(base, recorder.timeout)
	defer cancel()
	err := recorder.writer.WriteEvent(ctx, event)
	if err == nil {
		recorder.health.RecordSuccessfulWrite(recorder.clock.Now())
		return
	}
	reason := ReasonWriteFailed
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(ctx.Err(), context.DeadlineExceeded) {
		reason = ReasonWriteTimeout
	}
	recorder.health.RecordDropped(reason)
}

type NoOpEventWriter struct{}

func (NoOpEventWriter) WriteEvent(context.Context, domain.AnalyticsEvent) error { return nil }
