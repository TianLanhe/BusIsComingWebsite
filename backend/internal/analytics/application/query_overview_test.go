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
