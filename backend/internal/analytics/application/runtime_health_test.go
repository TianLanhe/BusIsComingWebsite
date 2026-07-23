package application

import (
	"context"
	"testing"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

func TestRuntimeHealthTracksSuccessfulWriteAndControlledReason(t *testing.T) {
	health := NewRuntimeHealth(time.UnixMilli(1_000))
	now := time.UnixMilli(2_000).UTC()
	health.RecordSuccessfulWrite(now)
	health.SetDatabaseState(DatabaseDegraded, ReasonWriteTimeout)

	snapshot := health.Snapshot()
	if snapshot.LastSuccessfulWriteAt == nil || !snapshot.LastSuccessfulWriteAt.Equal(now) {
		t.Fatalf("unexpected last successful write: %#v", snapshot.LastSuccessfulWriteAt)
	}
	if snapshot.DatabaseState != DatabaseDegraded || snapshot.Reason != ReasonWriteTimeout {
		t.Fatalf("unexpected controlled health state: %#v", snapshot)
	}
}

func TestRecordEventMarksSuccess(t *testing.T) {
	health := NewRuntimeHealth(time.UnixMilli(1_000))
	recorder := NewRecordEvent(writerFunc(func(context.Context, domain.AnalyticsEvent) error { return nil }), 50*time.Millisecond, health)
	recorder.Record(context.Background(), domain.AnalyticsEvent{})
	if health.Snapshot().LastSuccessfulWriteAt == nil {
		t.Fatal("expected successful write timestamp")
	}
}
