package sqlite

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
)

func TestPerformanceAndSystemSummariesAreSafe(t *testing.T) {
	path := filepath.Join(t.TempDir(), "analytics.sqlite")
	store, err := Open(context.Background(), path)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	success := overviewFixtureEvent(1, "abcdefghijklmnopqrstuv", domain.EventPlaceQuery, base)
	failure := overviewFixtureEvent(2, "0123456789abcdefghijkl", domain.EventPlaceQuery, base.Add(time.Minute))
	status := 429
	category := domain.FailureRateLimited
	failure.Outcome, failure.HTTPStatus, failure.StatusClass, failure.FailureCategory, failure.DurationMS = domain.OutcomeFailure, &status, domain.Status4xx, &category, 100
	for _, event := range []domain.AnalyticsEvent{success, failure} {
		if err := store.WriteEvent(context.Background(), event); err != nil {
			t.Fatal(err)
		}
	}
	health := analyticsapp.NewRuntimeHealth(base)
	health.RecordSuccessfulWrite(base.Add(time.Minute))
	usecase := analyticsapp.NewQueryDetails(store, health, analyticsapp.ClockFunc(func() time.Time { return base.Add(time.Hour) }), analyticsapp.ListenerStateFunc(func() string { return "available" }))
	performance, err := usecase.Performance(context.Background(), domain.AnalyticsQuery{From: base, To: base.Add(time.Hour), Granularity: domain.GranularityHour})
	if err != nil {
		t.Fatal(err)
	}
	if len(performance.Endpoints) != 4 || performance.Endpoints[1].SuccessRate == nil || len(performance.Failures) != 1 {
		t.Fatalf("unexpected performance: %#v", performance)
	}
	system := usecase.System(context.Background())
	if system.Database.State != analyticsapp.DatabaseAvailable || system.Database.RowCount == nil || *system.Database.RowCount != 2 || system.PrivateListener.BindAddress != "127.0.0.1:18081" {
		t.Fatalf("unsafe system summary: %#v", system)
	}
}

func TestSystemReturnsUnavailableWithoutStore(t *testing.T) {
	health := analyticsapp.NewRuntimeHealth(time.Now())
	health.SetDatabaseState(analyticsapp.DatabaseUnavailable, analyticsapp.ReasonOpenFailed)
	result := analyticsapp.NewQueryDetails(nil, health, analyticsapp.ClockFunc(time.Now), nil).System(context.Background())
	if result.Database.State != analyticsapp.DatabaseUnavailable || result.Database.RowCount != nil {
		t.Fatalf("unexpected unavailable system: %#v", result)
	}
}
