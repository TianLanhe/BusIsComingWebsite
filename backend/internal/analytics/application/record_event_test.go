package application

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

type writerFunc func(context.Context, domain.AnalyticsEvent) error

func (function writerFunc) WriteEvent(ctx context.Context, event domain.AnalyticsEvent) error {
	return function(ctx, event)
}

func TestRecordEventUsesIndependentDeadlineAndOneAttempt(t *testing.T) {
	var calls atomic.Int32
	recorder := NewRecordEvent(writerFunc(func(ctx context.Context, _ domain.AnalyticsEvent) error {
		calls.Add(1)
		deadline, ok := ctx.Deadline()
		if !ok {
			t.Fatal("writer context must have a deadline")
		}
		remaining := time.Until(deadline)
		if remaining <= 0 || remaining > 55*time.Millisecond {
			t.Fatalf("unexpected deadline: %v", remaining)
		}
		return nil
	}), 50*time.Millisecond, NewRuntimeHealth(time.UnixMilli(1_000)))

	parent, cancel := context.WithCancel(context.Background())
	cancel()
	recorder.Record(parent, domain.AnalyticsEvent{})
	if calls.Load() != 1 {
		t.Fatalf("expected one attempt, got %d", calls.Load())
	}
}

func TestRecordEventDropsExactlyOnceWithoutRetry(t *testing.T) {
	health := NewRuntimeHealth(time.UnixMilli(1_000))
	var calls atomic.Int32
	recorder := NewRecordEvent(writerFunc(func(context.Context, domain.AnalyticsEvent) error {
		calls.Add(1)
		return errors.New("database unavailable")
	}), 10*time.Millisecond, health)

	recorder.Record(context.Background(), domain.AnalyticsEvent{})
	if calls.Load() != 1 {
		t.Fatalf("expected one write attempt, got %d", calls.Load())
	}
	if health.Snapshot().DroppedSinceStart != 1 {
		t.Fatalf("expected one dropped event, got %d", health.Snapshot().DroppedSinceStart)
	}
}

func TestNoOpWriterDoesNotReturnAnError(t *testing.T) {
	if err := (NoOpEventWriter{}).WriteEvent(context.Background(), domain.AnalyticsEvent{}); err != nil {
		t.Fatalf("no-op writer must be fail-open: %v", err)
	}
}
