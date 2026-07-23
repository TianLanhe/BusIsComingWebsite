package application

import (
	"context"
	"encoding/json"
	"errors"
	"reflect"
	"strings"
	"testing"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

func TestQueryDetailsPerformanceReturnsFourOrderedSLISeriesWithNullAndZeroRates(t *testing.T) {
	location := time.FixedZone("Asia/Hong_Kong", 8*60*60)
	from := time.Date(2026, time.July, 20, 0, 0, 0, 0, location)
	events := []domain.AnalyticsEvent{
		detailTestEvent(1, "abcdefghijklmnopqrstuv", domain.EventPageView, from.Add(time.Hour)),
		detailTestEvent(2, "abcdefghijklmnopqrstuv", domain.EventPlaceQuery, from.Add(2*time.Hour)),
	}
	events[1].Outcome = domain.OutcomeFailure
	result, err := NewQueryDetails(&detailsStoreStub{events: events}, nil, ClockFunc(func() time.Time { return from }), nil).Performance(context.Background(), domain.AnalyticsQuery{From: from, To: from.Add(24 * time.Hour), Granularity: domain.GranularityDay})
	if err != nil {
		t.Fatal(err)
	}
	body, err := json.Marshal(result)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(body), `"sliSeries"`) || !strings.Contains(string(body), `"successRate":null`) || !strings.Contains(string(body), `"successRate":0`) {
		t.Fatalf("performance must expose ordered SLI null/zero semantics: %s", body)
	}
}

func TestQueryDetailsPerformanceComparesEndpointPercentilesWithoutInventingZeroRates(t *testing.T) {
	location := time.FixedZone("Asia/Hong_Kong", 8*60*60)
	from := time.Date(2026, time.July, 20, 0, 0, 0, 0, location)
	to := from.Add(24 * time.Hour)
	current := detailTestEvent(1, "abcdefghijklmnopqrstuv", domain.EventRouteQuery, from.Add(time.Hour))
	current.DurationMS = 150
	previous := detailTestEvent(2, "abcdefghijklmnopqrstuv", domain.EventRouteQuery, from.Add(-23*time.Hour))
	previous.DurationMS = 100
	store := &detailsStoreStub{eventsByFrom: map[time.Time][]domain.AnalyticsEvent{from: {current}, from.Add(-24 * time.Hour): {previous}}}
	result, err := NewQueryDetails(store, nil, ClockFunc(func() time.Time { return from }), nil).Performance(context.Background(), domain.AnalyticsQuery{From: from, To: to, Granularity: domain.GranularityDay, Compare: true})
	if err != nil {
		t.Fatal(err)
	}
	endpoint := result.Endpoints[2]
	if endpoint.P50Comparison.CurrentMS == nil || endpoint.P50Comparison.PreviousMS == nil || endpoint.P50Comparison.DeltaMS == nil || *endpoint.P50Comparison.DeltaMS != 50 || endpoint.P50Comparison.DeltaRate == nil || *endpoint.P50Comparison.DeltaRate != .5 {
		t.Fatalf("expected route percentile comparison, got %#v", endpoint.P50Comparison)
	}
	zero := percentileComparison(int64Pointer(50), int64Pointer(0), true)
	if zero.DeltaMS == nil || *zero.DeltaMS != 50 || zero.DeltaRate != nil {
		t.Fatalf("zero baseline must retain absolute delta only: %#v", zero)
	}
	missing := percentileComparison(nil, int64Pointer(100), true)
	if missing.PreviousMS == nil || *missing.PreviousMS != 100 || missing.DeltaMS != nil || missing.DeltaRate != nil {
		t.Fatalf("missing current must preserve previous sample and omit deltas: %#v", missing)
	}
	disabled := percentileComparison(int64Pointer(100), int64Pointer(80), false)
	if disabled.PreviousMS != nil || disabled.DeltaMS != nil || disabled.DeltaRate != nil {
		t.Fatalf("compare=false must omit comparison values: %#v", disabled)
	}
}

func int64Pointer(value int64) *int64 { return &value }

type detailsStoreStub struct {
	events         []domain.AnalyticsEvent
	eventsByFrom   map[time.Time][]domain.AnalyticsEvent
	listResult     StoredEventPage
	visitorEvents  []domain.AnalyticsEvent
	systemSnapshot SystemStorageSnapshot
	lastRequest    EventListRequest
}

func (store *detailsStoreStub) LoadOverviewEvents(_ context.Context, from, _ time.Time) ([]domain.AnalyticsEvent, error) {
	if store.eventsByFrom != nil {
		if events, ok := store.eventsByFrom[from]; ok {
			return events, nil
		}
	}
	return store.events, nil
}
func (store *detailsStoreStub) ListEvents(_ context.Context, request EventListRequest) (StoredEventPage, error) {
	store.lastRequest = request
	return store.listResult, nil
}
func (store *detailsStoreStub) SummarizeEvents(_ context.Context, request EventSummaryRequest) (EventRangeSummary, error) {
	// 测试替身沿用完整范围结果，便于验证分页参数不会进入摘要路径。
	if request.Query.Cursor != "" || request.Query.Limit != 0 {
		return EventRangeSummary{}, errors.New("summary must not receive pagination")
	}
	return store.listResult.Summary, nil
}
func (store *detailsStoreStub) LoadVisitorEvents(context.Context, string) ([]domain.AnalyticsEvent, error) {
	return store.visitorEvents, nil
}
func (store *detailsStoreStub) ReadStorageSnapshot(context.Context, time.Time, time.Time) (SystemStorageSnapshot, error) {
	return store.systemSnapshot, nil
}

func TestSystemUsesOneHongKongClockAndKeepsIndependentFacts(t *testing.T) {
	now := time.Date(2026, 7, 24, 16, 30, 0, 0, time.UTC)
	total, today, size := int64(9), int64(3), int64(4096)
	version, journal, schema := "3.50.4", "wal", "001"
	store := &detailsStoreStub{systemSnapshot: SystemStorageSnapshot{DatabaseRowCount: &total, DatabaseTodayRowCount: &today, DatabaseSizeBytes: &size, SQLiteVersion: &version, SQLiteJournalMode: &journal, SQLiteSchemaVersion: &schema}}
	health := NewRuntimeHealth(now.Add(-time.Hour))
	result := NewQueryDetailsWithBindAddress(store, health, ClockFunc(func() time.Time { return now }), ListenerStateFunc(func() string { return "available" }), "127.0.0.1:19081").System(context.Background())
	encoded, err := json.Marshal(result)
	if err != nil {
		t.Fatal(err)
	}
	var value map[string]any
	if err := json.Unmarshal(encoded, &value); err != nil {
		t.Fatal(err)
	}
	database := value["database"].(map[string]any)
	if database["todayLocalDate"] != "2026-07-25" || database["todayRowCount"] == nil {
		t.Fatalf("expected Hong Kong daily snapshot, got %s", encoded)
	}
	if value["sqlite"] == nil || value["process"].(map[string]any)["uptimeMs"] != float64(time.Hour.Milliseconds()) {
		t.Fatalf("expected runtime facts from the same injected clock, got %s", encoded)
	}
}

func TestSystemKeepsDroppedWhenProcessStartIsUnavailable(t *testing.T) {
	dropped := uint64(7)
	result := NewQueryDetails(nil, runtimeHealthStub{snapshot: RuntimeHealthSnapshot{DatabaseState: DatabaseUnavailable, DroppedSinceStart: dropped}}, ClockFunc(time.Now), nil).System(context.Background())
	if result.Process.StartedAt != nil || result.Process.UptimeMS != nil || result.Process.DroppedSinceStart == nil || *result.Process.DroppedSinceStart != dropped {
		t.Fatalf("dropped must not depend on process start: %#v", result.Process)
	}
}

func TestSystemKeepsStartWhenUptimeCannotBeCalculated(t *testing.T) {
	now := time.Date(2026, 7, 24, 0, 0, 0, 0, time.UTC)
	started := now.Add(time.Minute)
	result := NewQueryDetails(nil, runtimeHealthStub{snapshot: RuntimeHealthSnapshot{DatabaseState: DatabaseUnavailable, ProcessStartedAt: started}}, ClockFunc(func() time.Time { return now }), nil).System(context.Background())
	if result.Process.StartedAt == nil || !result.Process.StartedAt.Equal(started) || result.Process.UptimeMS != nil {
		t.Fatalf("start and uptime must degrade independently: %#v", result.Process)
	}
}

type runtimeHealthStub struct{ snapshot RuntimeHealthSnapshot }

func (stub runtimeHealthStub) Snapshot() RuntimeHealthSnapshot { return stub.snapshot }

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

func TestQueryDetailsEventsBuildsComparisonMetricsFromCompleteRanges(t *testing.T) {
	from := time.Date(2026, 7, 2, 0, 0, 0, 0, time.UTC)
	to := from.Add(24 * time.Hour)
	current := EventRangeSummary{TotalCount: 9, SuccessCount: 6, FailureCount: 3, UniqueVisitors: 4}
	previous := EventRangeSummary{TotalCount: 4, SuccessCount: 4, FailureCount: 0, UniqueVisitors: 2}
	store := &summaryStoreStub{detailsStoreStub: detailsStoreStub{listResult: StoredEventPage{Summary: current}}, summaries: map[time.Time]EventRangeSummary{from: current, from.Add(-24 * time.Hour): previous}}
	result, err := NewQueryDetails(store, nil, ClockFunc(func() time.Time { return to }), nil).Events(context.Background(), domain.AnalyticsQuery{From: from, To: to, Granularity: domain.GranularityDay, Compare: true, Limit: 1, Cursor: EncodeEventCursor(domain.EventCursor{OccurredAt: to, EventID: 10})}, "abcdefghijklmnopqrstuv")
	if err != nil {
		t.Fatal(err)
	}
	if len(result.SummaryMetrics) != 4 || result.SummaryMetrics[0].Key != "totalCount" || result.SummaryMetrics[0].Value == nil || *result.SummaryMetrics[0].Value != 9 || result.SummaryMetrics[0].PreviousValue == nil || *result.SummaryMetrics[0].PreviousValue != 4 || result.SummaryMetrics[2].PreviousValue == nil || *result.SummaryMetrics[2].PreviousValue != 0 || result.SummaryMetrics[2].DeltaRate != nil {
		t.Fatalf("unexpected complete-range metrics: %#v", result.SummaryMetrics)
	}
	if len(store.summaryRequests) != 2 || store.summaryRequests[0].VisitorID != "abcdefghijklmnopqrstuv" || store.summaryRequests[0].Query.Cursor != "" || store.summaryRequests[0].Query.Limit != 0 || store.summaryRequests[1].Query.From != from.Add(-24*time.Hour) {
		t.Fatalf("summary did not reuse filters without pagination: %#v", store.summaryRequests)
	}
}

type summaryStoreStub struct {
	detailsStoreStub
	summaries       map[time.Time]EventRangeSummary
	summaryRequests []EventSummaryRequest
}

func (store *summaryStoreStub) SummarizeEvents(_ context.Context, request EventSummaryRequest) (EventRangeSummary, error) {
	store.summaryRequests = append(store.summaryRequests, request)
	return store.summaries[request.Query.From], nil
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
	if result.PageInfo.TotalCount != int64(len(events)) || len(result.Sessions) != 1 || result.Sessions[0].EventCount != len(events) {
		t.Fatalf("pagination must not change the complete session timeline: %#v", result)
	}
}

func TestQueryDetailsVisitorUsesStableOrderingForPreferenceTies(t *testing.T) {
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	visitor := "abcdefghijklmnopqrstuv"
	events := []domain.AnalyticsEvent{
		detailTestEvent(1, visitor, domain.EventPageView, base),
		detailTestEvent(2, visitor, domain.EventDownloadRequest, base.Add(time.Minute)),
		detailTestEvent(3, visitor, domain.EventPageView, base.Add(2*time.Minute)),
		detailTestEvent(4, visitor, domain.EventDownloadRequest, base.Add(3*time.Minute)),
	}
	events[0].Locale, events[1].Locale, events[2].Locale, events[3].Locale = domain.LocaleZhHant, domain.LocaleEnglish, domain.LocaleZhHant, domain.LocaleEnglish
	events[0].DeviceType, events[1].DeviceType, events[2].DeviceType, events[3].DeviceType = domain.DeviceMobile, domain.DeviceDesktop, domain.DeviceMobile, domain.DeviceDesktop
	events[1].Download = &domain.DownloadAttribution{Platform: domain.PlatformIOS}
	events[3].Download = &domain.DownloadAttribution{Platform: domain.PlatformAndroid}
	result, err := NewQueryDetails(&detailsStoreStub{visitorEvents: events}, nil, ClockFunc(time.Now), nil).Visitor(context.Background(), visitor, 1, "")
	if err != nil {
		t.Fatal(err)
	}
	if result.Visitor.CommonLocale != domain.LocaleEnglish || result.Visitor.CommonDeviceType != domain.DeviceDesktop || result.Visitor.CommonPlatform == nil || *result.Visitor.CommonPlatform != domain.PlatformAndroid {
		t.Fatalf("preference ties must use stable enum ordering: %#v", result.Visitor)
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

func TestTrafficMetricValuesCountFailedPlaceAndRouteVisitors(t *testing.T) {
	base := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	events := []domain.AnalyticsEvent{
		detailTestEvent(1, "abcdefghijklmnopqrstuv", domain.EventPlaceQuery, base),
		detailTestEvent(2, "abcdefghijklmnopqrstuv", domain.EventPlaceQuery, base.Add(time.Minute)),
		detailTestEvent(3, "0123456789abcdefghijkl", domain.EventPlaceQuery, base.Add(2*time.Minute)),
		detailTestEvent(4, "abcdefghijklmnopqrstuv", domain.EventRouteQuery, base.Add(3*time.Minute)),
		detailTestEvent(5, "0123456789abcdefghijkl", domain.EventRouteQuery, base.Add(4*time.Minute)),
	}
	events[2].Outcome, events[4].Outcome = domain.OutcomeFailure, domain.OutcomeFailure
	values := trafficMetricValues(events)
	if values["placeQueryRequests"] != 3 || values["placeQueryVisitors"] != 2 || values["routeQueryRequests"] != 2 || values["routeQueryVisitors"] != 2 || len(values) != 6 {
		t.Fatalf("PV must include failures and UV must deduplicate complete range: %#v", values)
	}
}

func TestQueryDetailsTrafficExposesExactlySixPublicCardMetrics(t *testing.T) {
	from := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	events := []domain.AnalyticsEvent{
		detailTestEvent(1, "abcdefghijklmnopqrstuv", domain.EventPageView, from),
		detailTestEvent(2, "abcdefghijklmnopqrstuv", domain.EventPlaceQuery, from.Add(time.Minute)),
		detailTestEvent(3, "0123456789abcdefghijkl", domain.EventRouteQuery, from.Add(2*time.Minute)),
	}
	result, err := NewQueryDetails(&detailsStoreStub{events: events}, nil, ClockFunc(func() time.Time { return from }), nil).Traffic(context.Background(), domain.AnalyticsQuery{From: from, To: from.Add(time.Hour), Granularity: domain.GranularityHour})
	if err != nil {
		t.Fatal(err)
	}
	keys := make([]string, len(result.Metrics))
	for index, metric := range result.Metrics {
		keys[index] = metric.Key
	}
	want := []string{"pv", "uv", "placeQueryRequests", "placeQueryVisitors", "routeQueryRequests", "routeQueryVisitors"}
	if !reflect.DeepEqual(keys, want) {
		t.Fatalf("public traffic metrics = %#v, want %#v", keys, want)
	}
	if result.Series[0].SuccessfulPlaceVisitors != 1 || result.Series[0].SuccessfulRouteVisitors != 1 || len(result.TrialFunnel.Stages) == 0 {
		t.Fatalf("success-only visitors must remain available to trend/funnel: %#v %#v", result.Series, result.TrialFunnel)
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
