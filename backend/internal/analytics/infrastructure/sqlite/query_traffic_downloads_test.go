package sqlite

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
)

func TestTrafficAndDownloadsProduceHeatmapVersionsPlatformsAndFailures(t *testing.T) {
	store, err := Open(context.Background(), filepath.Join(t.TempDir(), "analytics.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	from := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	page := overviewFixtureEvent(1, "abcdefghijklmnopqrstuv", domain.EventPageView, from.Add(time.Minute))
	place := overviewFixtureEvent(2, "abcdefghijklmnopqrstuv", domain.EventPlaceQuery, from.Add(2*time.Minute))
	download := overviewFixtureEvent(3, "abcdefghijklmnopqrstuv", domain.EventDownloadRequest, from.Add(3*time.Minute))
	download.Download = &domain.DownloadAttribution{Platform: domain.PlatformAndroid, VersionName: "1.2", VersionCode: 12, SizeBytes: 1234}
	failure := overviewFixtureEvent(4, "0123456789abcdefghijkl", domain.EventDownloadRequest, from.Add(4*time.Minute))
	status := 503
	category := domain.FailureExternalUnavailable
	failure.Outcome, failure.HTTPStatus, failure.StatusClass, failure.FailureCategory = domain.OutcomeFailure, &status, domain.Status5xx, &category
	for _, event := range []domain.AnalyticsEvent{page, place, download, failure} {
		if err := store.WriteEvent(context.Background(), event); err != nil {
			t.Fatal(err)
		}
	}
	query := domain.AnalyticsQuery{From: from, To: from.Add(24 * time.Hour), Granularity: domain.GranularityHour}
	usecase := analyticsapp.NewQueryDetails(store, nil, analyticsapp.ClockFunc(time.Now), nil)
	traffic, err := usecase.Traffic(context.Background(), query)
	if err != nil {
		t.Fatal(err)
	}
	if len(traffic.Heatmap) != 2 || traffic.TrialFunnel.Stages[1].UniqueVisitors != 1 {
		t.Fatalf("unexpected traffic: %#v", traffic)
	}
	downloads, err := usecase.Downloads(context.Background(), query)
	if err != nil {
		t.Fatal(err)
	}
	if len(downloads.Versions) != 1 || downloads.Versions[0].VersionCode != 12 || len(downloads.Platforms) != 1 || len(downloads.Failures) != 1 {
		t.Fatalf("unexpected downloads: %#v", downloads)
	}
}
