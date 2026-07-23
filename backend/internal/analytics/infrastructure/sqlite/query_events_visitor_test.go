package sqlite

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
)

func TestEventKeysetPaginationHasNoDuplicateOrGapAtSameMillisecond(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	visitor := "abcdefghijklmnopqrstuv"
	for id := int64(1); id <= 5; id++ {
		if err := store.WriteEvent(context.Background(), overviewFixtureEvent(id, visitor, domain.EventPageView, base)); err != nil {
			t.Fatal(err)
		}
	}
	usecase := analyticsapp.NewQueryDetails(store, nil, analyticsapp.ClockFunc(time.Now), nil)
	query := domain.AnalyticsQuery{From: base, To: base.Add(time.Hour), Granularity: domain.GranularityHour, Limit: 2}
	first, err := usecase.Events(context.Background(), query, "")
	if err != nil {
		t.Fatal(err)
	}
	if first.PageInfo.NextCursor == nil {
		t.Fatal("first page must include a cursor")
	}
	query.Cursor = *first.PageInfo.NextCursor
	second, err := usecase.Events(context.Background(), query, "")
	if err != nil {
		t.Fatal(err)
	}
	if first.Items[0].EventID != "5" || first.Items[1].EventID != "4" || second.Items[0].EventID != "3" || second.Items[1].EventID != "2" {
		t.Fatalf("unstable pages first=%#v second=%#v", first.Items, second.Items)
	}
	if first.Items[0].VisitorID != visitor {
		t.Fatal("API keeps exact visitor while UI is responsible for truncation")
	}
}

func TestVisitorSummaryAndThirtyMinuteBoundary(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	visitor := "abcdefghijklmnopqrstuv"
	for index, offset := range []time.Duration{0, 30 * time.Minute, 60*time.Minute + time.Millisecond} {
		if err := store.WriteEvent(context.Background(), overviewFixtureEvent(int64(index+1), visitor, domain.EventPageView, base.Add(offset))); err != nil {
			t.Fatal(err)
		}
	}
	result, err := analyticsapp.NewQueryDetails(store, nil, analyticsapp.ClockFunc(time.Now), nil).Visitor(context.Background(), visitor, 50, "")
	if err != nil {
		t.Fatal(err)
	}
	if result.Visitor.EventCount != 3 || result.Visitor.SessionCount != 2 || len(result.Sessions) != 2 {
		t.Fatalf("unexpected visitor: %#v", result)
	}
}
