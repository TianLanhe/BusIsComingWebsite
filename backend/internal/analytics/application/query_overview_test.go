package application

import (
	"context"
	"testing"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

type overviewEventStoreFunc func(context.Context, time.Time, time.Time) ([]domain.AnalyticsEvent, error)

func (function overviewEventStoreFunc) LoadOverviewEvents(ctx context.Context, from, to time.Time) ([]domain.AnalyticsEvent, error) {
	return function(ctx, from, to)
}

func TestQueryOverviewCalculatesMetricsAndKeepsDownloadFiltersScoped(t *testing.T) {
	from := time.Date(2026, time.July, 1, 0, 0, 0, 0, time.UTC)
	to := from.Add(24 * time.Hour)
	current := []domain.AnalyticsEvent{
		overviewEvent(1, "abcdefghijklmnopqrstuv", domain.EventPageView, from.Add(time.Hour)),
		overviewDownload(2, "abcdefghijklmnopqrstuv", domain.PlatformAndroid, "1.0", 1, from.Add(2*time.Hour)),
		overviewDownload(3, "0123456789abcdefghijkl", domain.PlatformIOS, "2.0", 2, from.Add(3*time.Hour)),
	}
	store := overviewEventStoreFunc(func(_ context.Context, rangeFrom, rangeTo time.Time) ([]domain.AnalyticsEvent, error) {
		if rangeFrom.Equal(from) && rangeTo.Equal(to) {
			return current, nil
		}
		return nil, nil
	})
	usecase := NewQueryOverview(store, ClockFunc(func() time.Time { return to.Add(time.Hour) }))
	result, err := usecase.Execute(context.Background(), domain.AnalyticsQuery{
		From: from, To: to, Granularity: domain.GranularityHour, Platforms: []domain.Platform{domain.PlatformAndroid}, Compare: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if metricValue(result.Metrics, "pv") != 1 || metricValue(result.Metrics, "uv") != 1 {
		t.Fatalf("download filter changed PV/UV: %#v", result.Metrics)
	}
	if metricValue(result.Metrics, "downloadRequests") != 1 {
		t.Fatalf("download filter was not applied to download metrics: %#v", result.Metrics)
	}
	if result.Meta.State != domain.QueryReady || result.Meta.ComparisonFrom == nil || result.Meta.ComparisonTo == nil {
		t.Fatalf("unexpected meta: %#v", result.Meta)
	}
}

func TestQueryOverviewReturnsNoDataAndNoResultsDistinctly(t *testing.T) {
	from := time.Date(2026, time.July, 1, 0, 0, 0, 0, time.UTC)
	to := from.Add(time.Hour)
	tests := []struct {
		name     string
		events   []domain.AnalyticsEvent
		locales  []domain.Locale
		expected domain.QueryState
	}{
		{"no data", nil, nil, domain.QueryNoData},
		{"no results", []domain.AnalyticsEvent{overviewEvent(1, "abcdefghijklmnopqrstuv", domain.EventPageView, from)}, []domain.Locale{domain.LocaleEnglish}, domain.QueryNoResults},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			store := overviewEventStoreFunc(func(context.Context, time.Time, time.Time) ([]domain.AnalyticsEvent, error) { return test.events, nil })
			result, err := NewQueryOverview(store, ClockFunc(func() time.Time { return to })).Execute(context.Background(), domain.AnalyticsQuery{From: from, To: to, Granularity: domain.GranularityHour, Locales: test.locales})
			if err != nil {
				t.Fatal(err)
			}
			if result.Meta.State != test.expected {
				t.Fatalf("expected %s, got %s", test.expected, result.Meta.State)
			}
		})
	}
}

func TestQueryOverviewReturnsSuccessfulLatencyByEventInStableOrder(t *testing.T) {
	from := time.Date(2026, time.July, 1, 0, 0, 0, 0, time.UTC)
	to := from.Add(24 * time.Hour)
	events := []domain.AnalyticsEvent{}
	types := []domain.EventType{domain.EventPageView, domain.EventPlaceQuery, domain.EventRouteQuery, domain.EventDownloadRequest}
	id := int64(1)
	for typeIndex, eventType := range types {
		for _, duration := range []int64{10, 20, 30, 40, 100 + int64(typeIndex)} {
			event := overviewEvent(id, "abcdefghijklmnopqrstuv", eventType, from.Add(time.Duration(id)*time.Minute))
			event.DurationMS = duration
			events = append(events, event)
			id++
		}
		failure := overviewEvent(id, "0123456789abcdefghijkl", eventType, from.Add(time.Duration(id)*time.Minute))
		failure.Outcome = domain.OutcomeFailure
		failure.DurationMS = 9_999
		events = append(events, failure)
		id++
	}
	store := overviewEventStoreFunc(func(context.Context, time.Time, time.Time) ([]domain.AnalyticsEvent, error) { return events, nil })
	result, err := NewQueryOverview(store, ClockFunc(func() time.Time { return to })).Execute(
		context.Background(),
		domain.AnalyticsQuery{From: from, To: to, Granularity: domain.GranularityDay},
	)
	if err != nil {
		t.Fatal(err)
	}
	if len(result.LatencyByEvent) != 4 {
		t.Fatalf("latencyByEvent length=%d", len(result.LatencyByEvent))
	}
	for index, eventType := range types {
		item := result.LatencyByEvent[index]
		if item.EventType != eventType || item.RequestCount != 5 || item.P95MS == nil || *item.P95MS != 100+int64(index) {
			t.Fatalf("latencyByEvent[%d]=%#v", index, item)
		}
	}
}

func TestQueryOverviewKeepsMissingPreviousPopulationNullAndRealZeroComparable(t *testing.T) {
	current := map[string]float64{"pv": 2}
	metrics := buildMetrics(current, map[string]float64{"pv": 0}, map[string]bool{"pv": true}, true, domain.QueryReady)
	pv := findMetric(metrics, "pv")
	if pv.PreviousValue == nil || *pv.PreviousValue != 0 || pv.Delta == nil || *pv.Delta != 2 || pv.DeltaRate != nil {
		t.Fatalf("real zero must remain comparable: %#v", pv)
	}

	metrics = buildMetrics(current, map[string]float64{}, map[string]bool{}, true, domain.QueryReady)
	pv = findMetric(metrics, "pv")
	if pv.PreviousValue != nil || pv.Delta != nil || pv.DeltaRate != nil {
		t.Fatalf("missing previous population must remain null: %#v", pv)
	}
}

func TestDistributionByVersionMergesPackageSizeChangesIntoOneVisibleVersion(t *testing.T) {
	base := time.Date(2026, time.July, 1, 0, 0, 0, 0, time.UTC)
	events := []domain.AnalyticsEvent{
		overviewDownload(1, "abcdefghijklmnopqrstuv", domain.PlatformAndroid, "1.1", 4, base),
		overviewDownload(2, "0123456789abcdefghijkl", domain.PlatformAndroid, "1.1", 4, base.Add(time.Hour)),
		overviewDownload(3, "abcdefghijklmnopqrstuv", domain.PlatformAndroid, "1.1", 4, base.Add(2*time.Hour)),
	}
	events[0].Download.SizeBytes = 5_000_000
	events[1].Download.SizeBytes = 5_100_000
	events[2].Download.SizeBytes = 5_200_000

	got := distributionByVersion(events)
	if len(got) != 1 {
		t.Fatalf("same visible version must be one row, got %#v", got)
	}
	if got[0].RequestCount != 3 || got[0].SuccessfulResponses != 3 || got[0].UV != 2 {
		t.Fatalf("version counters were not merged: %#v", got[0])
	}
	if got[0].SizeBytes != 5_200_000 {
		t.Fatalf("latest package size = %d, want 5200000", got[0].SizeBytes)
	}
}

func findMetric(metrics []domain.Metric, key string) domain.Metric {
	for _, metric := range metrics {
		if metric.Key == key {
			return metric
		}
	}
	return domain.Metric{}
}

func metricValue(metrics []domain.Metric, key string) float64 {
	for _, metric := range metrics {
		if metric.Key == key && metric.Value != nil {
			return *metric.Value
		}
	}
	return -1
}

func overviewEvent(id int64, visitor string, eventType domain.EventType, at time.Time) domain.AnalyticsEvent {
	status := 200
	return domain.AnalyticsEvent{EventID: id, OccurredAt: at.UTC(), VisitorID: visitor, EventType: eventType, Outcome: domain.OutcomeSuccess, HTTPStatus: &status, StatusClass: domain.Status2xx, DurationMS: 20, Locale: domain.LocaleZhHant, DeviceType: domain.DeviceMobile, SourceType: domain.SourceDirect}
}

func overviewDownload(id int64, visitor string, platform domain.Platform, versionName string, versionCode int64, at time.Time) domain.AnalyticsEvent {
	event := overviewEvent(id, visitor, domain.EventDownloadRequest, at)
	event.Download = &domain.DownloadAttribution{Platform: platform, VersionName: versionName, VersionCode: versionCode, SizeBytes: 100}
	return event
}
