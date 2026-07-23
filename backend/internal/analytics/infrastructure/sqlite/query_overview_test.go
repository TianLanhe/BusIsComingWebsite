package sqlite

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
)

func TestSQLiteOverviewFixtureUsesRangeAndHongKongBuckets(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	location, err := time.LoadLocation("Asia/Hong_Kong")
	if err != nil {
		t.Fatal(err)
	}
	from := time.Date(2026, time.July, 1, 0, 0, 0, 0, location)
	to := from.Add(2 * 24 * time.Hour)
	for _, event := range []domain.AnalyticsEvent{
		overviewFixtureEvent(1, "abcdefghijklmnopqrstuv", domain.EventPageView, from.Add(time.Hour)),
		overviewFixtureEvent(2, "abcdefghijklmnopqrstuv", domain.EventPlaceQuery, from.Add(2*time.Hour)),
		overviewFixtureEvent(3, "abcdefghijklmnopqrstuv", domain.EventRouteQuery, from.Add(3*time.Hour)),
	} {
		if err := store.WriteEvent(context.Background(), event); err != nil {
			t.Fatal(err)
		}
	}
	result, err := analyticsapp.NewQueryOverview(store, analyticsapp.ClockFunc(func() time.Time { return to })).Execute(context.Background(), domain.AnalyticsQuery{From: from, To: to, Granularity: domain.GranularityDay})
	if err != nil {
		t.Fatal(err)
	}
	if result.Meta.State != domain.QueryReady || len(result.TrafficSeries) != 2 {
		t.Fatalf("unexpected fixture result: %#v", result)
	}
	if result.TrafficSeries[0].PV != 1 || result.TrafficSeries[1].PV != 0 {
		t.Fatalf("missing buckets were not filled: %#v", result.TrafficSeries)
	}
}

func overviewFixtureEvent(id int64, visitor string, eventType domain.EventType, at time.Time) domain.AnalyticsEvent {
	status := 200
	return domain.AnalyticsEvent{EventID: id, OccurredAt: at.UTC(), VisitorID: visitor, EventType: eventType, Outcome: domain.OutcomeSuccess, HTTPStatus: &status, StatusClass: domain.Status2xx, DurationMS: 10 * id, Locale: domain.LocaleZhHant, DeviceType: domain.DeviceMobile, SourceType: domain.SourceSearch}
}
