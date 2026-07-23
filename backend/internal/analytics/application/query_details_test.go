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
		store := &detailsStoreStub{listResult: StoredEventPage{Items: []domain.AnalyticsEvent{}, Summary: EventRangeSummary{}}}
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

func TestQueryDetailsEventsReturnsFullRangeSummaryIndependentOfCursor(t *testing.T) {
	from := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	store := &detailsStoreStub{listResult: StoredEventPage{
		Items:   []domain.AnalyticsEvent{detailTestEvent(4, "abcdefghijklmnopqrstuv", domain.EventPageView, from.Add(4*time.Minute))},
		Summary: EventRangeSummary{TotalCount: 9, SuccessCount: 7, FailureCount: 2, UniqueVisitors: 3},
		HasMore: true,
	}}
	result, err := NewQueryDetails(store, nil, ClockFunc(time.Now), nil).Events(context.Background(), domain.AnalyticsQuery{
		From: from, To: from.Add(time.Hour), Granularity: domain.GranularityHour, Limit: 1,
		Cursor: EncodeEventCursor(domain.EventCursor{OccurredAt: from.Add(5 * time.Minute), EventID: 5}),
	}, "")
	if err != nil {
		t.Fatal(err)
	}
	if result.Summary != store.listResult.Summary || result.PageInfo.TotalCount != result.Summary.TotalCount {
		t.Fatalf("summary/page total mismatch: %#v", result)
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

func TestQueryDetailsVisitorUsesCompleteHistoryForCompositionAndCommonPlatform(t *testing.T) {
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	visitor := "abcdefghijklmnopqrstuv"
	events := []domain.AnalyticsEvent{
		detailTestEvent(1, visitor, domain.EventPageView, base),
		detailTestEvent(2, visitor, domain.EventPlaceQuery, base.Add(time.Minute)),
		detailTestEvent(3, visitor, domain.EventDownloadRequest, base.Add(2*time.Minute)),
		detailTestEvent(4, visitor, domain.EventDownloadRequest, base.Add(3*time.Minute)),
	}
	events[2].Download = &domain.DownloadAttribution{Platform: domain.PlatformAndroid, VersionName: "1.0", VersionCode: 1, SizeBytes: 1024}
	events[3].Download = &domain.DownloadAttribution{Platform: domain.PlatformAndroid, VersionName: "1.0", VersionCode: 1, SizeBytes: 1024}
	result, err := NewQueryDetails(&detailsStoreStub{visitorEvents: events}, nil, ClockFunc(time.Now), nil).Visitor(context.Background(), visitor, 1, "")
	if err != nil {
		t.Fatal(err)
	}
	if result.Visitor.CommonPlatform == nil || *result.Visitor.CommonPlatform != domain.PlatformAndroid {
		t.Fatalf("common platform = %#v", result.Visitor.CommonPlatform)
	}
	var total int64
	for _, item := range result.Visitor.EventComposition {
		total += item.Count
	}
	if total != int64(len(events)) || len(result.Visitor.EventComposition) != 3 {
		t.Fatalf("composition must use complete history: %#v", result.Visitor.EventComposition)
	}
	if result.PageInfo.TotalCount != int64(len(events)) || len(result.Sessions) != 1 || result.Sessions[0].EventCount != 1 {
		t.Fatalf("pagination must not change summary: %#v", result)
	}
}

func TestQueryDetailsVisitorWithoutDownloadHasNullCommonPlatform(t *testing.T) {
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	visitor := "abcdefghijklmnopqrstuv"
	result, err := NewQueryDetails(&detailsStoreStub{visitorEvents: []domain.AnalyticsEvent{
		detailTestEvent(1, visitor, domain.EventPageView, base),
	}}, nil, ClockFunc(time.Now), nil).Visitor(context.Background(), visitor, 50, "")
	if err != nil {
		t.Fatal(err)
	}
	if result.Visitor.CommonPlatform != nil {
		t.Fatalf("common platform should be null: %#v", result.Visitor.CommonPlatform)
	}
}

func TestBuildMetricsForKeysDistinguishesMissingPreviousPopulationFromZero(t *testing.T) {
	current := map[string]float64{"requestCount": 5}
	metrics := buildMetricsForKeys(current, map[string]float64{"requestCount": 0}, true, domain.QueryReady, []string{"requestCount"}, true)
	if metrics[0].PreviousValue == nil || *metrics[0].PreviousValue != 0 || metrics[0].Delta == nil || *metrics[0].Delta != 5 {
		t.Fatalf("real zero comparison lost: %#v", metrics[0])
	}
	metrics = buildMetricsForKeys(current, map[string]float64{}, true, domain.QueryReady, []string{"requestCount"}, false)
	if metrics[0].PreviousValue != nil || metrics[0].Delta != nil || metrics[0].DeltaRate != nil {
		t.Fatalf("missing comparison should stay null: %#v", metrics[0])
	}
}

func TestTrafficHeatmapReturnsSortedHongKongCalendarDaysIncludingZeroDates(t *testing.T) {
	location, err := time.LoadLocation("Asia/Hong_Kong")
	if err != nil {
		t.Fatal(err)
	}
	from := time.Date(2026, time.July, 1, 12, 0, 0, 0, location)
	to := time.Date(2026, time.July, 4, 8, 0, 0, 0, location)
	events := []domain.AnalyticsEvent{
		detailTestEvent(1, "abcdefghijklmnopqrstuv", domain.EventPageView, from.Add(time.Hour)),
		detailTestEvent(2, "abcdefghijklmnopqrstuv", domain.EventRouteQuery, time.Date(2026, time.July, 3, 1, 0, 0, 0, location)),
		detailTestEvent(3, "0123456789abcdefghijkl", domain.EventPageView, time.Date(2026, time.July, 3, 2, 0, 0, 0, location)),
	}
	cells := trafficHeatmap(events, from, to)
	if len(cells) != 4 {
		t.Fatalf("expected 4 daily cells, got %d: %#v", len(cells), cells)
	}
	expectedDates := []string{"2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04"}
	for index, expected := range expectedDates {
		if cells[index].LocalDate != expected {
			t.Fatalf("cell[%d].LocalDate=%s", index, cells[index].LocalDate)
		}
	}
	if !cells[0].BucketStart.Equal(from) || cells[0].EventCount != 1 || cells[0].UV != 1 {
		t.Fatalf("first partial bucket=%#v", cells[0])
	}
	if cells[1].EventCount != 0 || cells[1].UV != 0 {
		t.Fatalf("zero date=%#v", cells[1])
	}
	if cells[2].EventCount != 2 || cells[2].UV != 2 {
		t.Fatalf("third date=%#v", cells[2])
	}
	if !cells[3].BucketEnd.Equal(to) {
		t.Fatalf("last partial bucket end=%s", cells[3].BucketEnd)
	}
}

func detailTestEvent(id int64, visitor string, eventType domain.EventType, at time.Time) domain.AnalyticsEvent {
	status := 200
	return domain.AnalyticsEvent{EventID: id, OccurredAt: at.UTC(), VisitorID: visitor, EventType: eventType, Outcome: domain.OutcomeSuccess, HTTPStatus: &status, StatusClass: domain.Status2xx, DurationMS: id * 10, Locale: domain.LocaleZhHant, DeviceType: domain.DeviceMobile, SourceType: domain.SourceDirect}
}
