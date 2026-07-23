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

func TestEventSummaryUsesFullFilteredRangeAndIgnoresCursor(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	visitors := []string{"abcdefghijklmnopqrstuv", "0123456789abcdefghijkl", "visitor_12345678901234"}
	for index := 0; index < 4; index++ {
		event := overviewFixtureEvent(int64(index+1), visitors[index%2], domain.EventRouteQuery, base.Add(time.Duration(index)*time.Minute))
		if index == 3 {
			status := 503
			category := domain.FailureInternal
			event.Outcome, event.HTTPStatus, event.StatusClass, event.FailureCategory = domain.OutcomeFailure, &status, domain.Status5xx, &category
		}
		if err := store.WriteEvent(context.Background(), event); err != nil {
			t.Fatal(err)
		}
	}
	// 这条不同事件类型的数据用于证明摘要复用了全部筛选条件。
	if err := store.WriteEvent(context.Background(), overviewFixtureEvent(5, visitors[2], domain.EventPageView, base.Add(5*time.Minute))); err != nil {
		t.Fatal(err)
	}
	query := domain.AnalyticsQuery{From: base, To: base.Add(time.Hour), Granularity: domain.GranularityHour, EventTypes: []domain.EventType{domain.EventRouteQuery}, Limit: 2}
	first, err := store.ListEvents(context.Background(), analyticsapp.EventListRequest{Query: query, Limit: 2})
	if err != nil {
		t.Fatal(err)
	}
	cursor := domain.EventCursor{OccurredAt: first.Items[len(first.Items)-1].OccurredAt, EventID: first.Items[len(first.Items)-1].EventID}
	second, err := store.ListEvents(context.Background(), analyticsapp.EventListRequest{Query: query, Cursor: &cursor, Limit: 2})
	if err != nil {
		t.Fatal(err)
	}
	want := analyticsapp.EventRangeSummary{TotalCount: 4, SuccessCount: 3, FailureCount: 1, UniqueVisitors: 2}
	if first.Summary != want || second.Summary != want {
		t.Fatalf("cursor changed full-range summary: first=%#v second=%#v", first.Summary, second.Summary)
	}
	if len(first.Items) != 2 || len(second.Items) != 2 {
		t.Fatalf("unexpected pages: %d %d", len(first.Items), len(second.Items))
	}
}

func TestEventSummaryQueryPlanUsesTimeIndex(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	builder := newEventQueryBuilder(base, base.Add(24*time.Hour))
	query, args := builder.summarySQL()
	assertQueryPlanUsesIndex(t, store.db, query, args, "idx_analytics_events_time")
}

func TestSummarizeEventsKeepsFiltersAndDistinctVisitorsWithoutPagination(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	first, second := "abcdefghijklmnopqrstuv", "0123456789abcdefghijkl"
	for id, event := range []domain.AnalyticsEvent{
		overviewFixtureEvent(1, first, domain.EventRouteQuery, base),
		overviewFixtureEvent(2, first, domain.EventRouteQuery, base.Add(time.Minute)),
		overviewFixtureEvent(3, second, domain.EventRouteQuery, base.Add(2*time.Minute)),
		overviewFixtureEvent(4, second, domain.EventPageView, base.Add(3*time.Minute)),
	} {
		if id == 2 {
			status := 503
			category := domain.FailureInternal
			event.Outcome, event.HTTPStatus, event.StatusClass, event.FailureCategory = domain.OutcomeFailure, &status, domain.Status5xx, &category
		}
		if err := store.WriteEvent(context.Background(), event); err != nil {
			t.Fatal(err)
		}
	}
	query := domain.AnalyticsQuery{From: base, To: base.Add(time.Hour), Granularity: domain.GranularityHour, EventTypes: []domain.EventType{domain.EventRouteQuery}, Cursor: "must-not-be-used", Limit: 1}
	summary, err := store.SummarizeEvents(context.Background(), analyticsapp.EventSummaryRequest{Query: query})
	if err != nil {
		t.Fatal(err)
	}
	if summary != (analyticsapp.EventRangeSummary{TotalCount: 3, SuccessCount: 2, FailureCount: 1, UniqueVisitors: 2}) {
		t.Fatalf("unexpected summary: %#v", summary)
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
