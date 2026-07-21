package application

import (
	"context"
	"testing"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

type detailsStoreStub struct {
	events        []domain.AnalyticsEvent
	listResult    StoredEventPage
	visitorEvents []domain.AnalyticsEvent
	lastRequest   EventListRequest
}

func (store *detailsStoreStub) LoadOverviewEvents(context.Context, time.Time, time.Time) ([]domain.AnalyticsEvent, error) {
	return store.events, nil
}
func (store *detailsStoreStub) ListEvents(_ context.Context, request EventListRequest) (StoredEventPage, error) {
	store.lastRequest = request
	return store.listResult, nil
}
func (store *detailsStoreStub) LoadVisitorEvents(context.Context, string) ([]domain.AnalyticsEvent, error) {
	return store.visitorEvents, nil
}
func (store *detailsStoreStub) ReadStorageSnapshot(context.Context) (SystemStorageSnapshot, error) {
	return SystemStorageSnapshot{}, nil
}

func TestEventCursorRoundTripKeepsSameMillisecondStableID(t *testing.T) {
	cursor := domain.EventCursor{OccurredAt: time.Date(2026, 7, 1, 1, 2, 3, 4_000_000, time.UTC), EventID: 42}
	encoded := EncodeEventCursor(cursor)
	decoded, err := DecodeEventCursor(encoded)
	if err != nil || !decoded.OccurredAt.Equal(cursor.OccurredAt) || decoded.EventID != cursor.EventID {
		t.Fatalf("cursor round trip failed: %#v %v", decoded, err)
	}
	if _, err := DecodeEventCursor("not-a-valid-cursor"); err == nil {
		t.Fatal("invalid cursor must fail")
	}
}

func TestQueryDetailsEventsDefaultsTo50AndAcceptsMaximum100(t *testing.T) {
	from := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	for _, limit := range []int{0, 100} {
		store := &detailsStoreStub{listResult: StoredEventPage{Items: []domain.AnalyticsEvent{}, TotalCount: 0}}
		usecase := NewQueryDetails(store, nil, ClockFunc(time.Now), nil)
		_, err := usecase.Events(context.Background(), domain.AnalyticsQuery{From: from, To: from.Add(time.Hour), Granularity: domain.GranularityHour, Limit: limit}, "")
		if err != nil {
			t.Fatal(err)
		}
		expected := limit
		if expected == 0 {
			expected = 50
		}
		if store.lastRequest.Limit != expected {
			t.Fatalf("limit=%d expected=%d", store.lastRequest.Limit, expected)
		}
	}
}

func TestQueryDetailsVisitorRequiresExactIDAndPreservesSessionBoundary(t *testing.T) {
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	visitor := "abcdefghijklmnopqrstuv"
	store := &detailsStoreStub{visitorEvents: []domain.AnalyticsEvent{
		detailTestEvent(1, visitor, domain.EventPageView, base),
		detailTestEvent(2, visitor, domain.EventPlaceQuery, base.Add(30*time.Minute)),
		detailTestEvent(3, visitor, domain.EventRouteQuery, base.Add(60*time.Minute+time.Millisecond)),
	}}
	result, err := NewQueryDetails(store, nil, ClockFunc(func() time.Time { return base.Add(time.Hour) }), nil).Visitor(context.Background(), visitor, 50, "")
	if err != nil {
		t.Fatal(err)
	}
	if result.Visitor.VisitorID != visitor || result.Visitor.SessionCount != 2 || len(result.Sessions) != 2 {
		t.Fatalf("unexpected visitor result: %#v", result)
	}
	if _, err := NewQueryDetails(store, nil, ClockFunc(time.Now), nil).Visitor(context.Background(), "truncated…", 50, ""); err == nil {
		t.Fatal("non-exact visitor ID must fail")
	}
}

func detailTestEvent(id int64, visitor string, eventType domain.EventType, at time.Time) domain.AnalyticsEvent {
	status := 200
	return domain.AnalyticsEvent{EventID: id, OccurredAt: at.UTC(), VisitorID: visitor, EventType: eventType, Outcome: domain.OutcomeSuccess, HTTPStatus: &status, StatusClass: domain.Status2xx, DurationMS: id * 10, Locale: domain.LocaleZhHant, DeviceType: domain.DeviceMobile, SourceType: domain.SourceDirect}
}
