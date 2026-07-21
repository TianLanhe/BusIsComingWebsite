package domain

import (
	"testing"
	"time"
)

func TestDeriveSessionsKeepsExactlyThirtyMinutesAndSplitsAfter(t *testing.T) {
	base := time.Date(2026, time.July, 1, 0, 0, 0, 0, time.UTC)
	events := []AnalyticsEvent{
		aggregationEvent(1, "abcdefghijklmnopqrstuv", EventPageView, OutcomeSuccess, base),
		aggregationEvent(2, "abcdefghijklmnopqrstuv", EventPlaceQuery, OutcomeSuccess, base.Add(30*time.Minute)),
		aggregationEvent(3, "abcdefghijklmnopqrstuv", EventRouteQuery, OutcomeSuccess, base.Add(60*time.Minute+time.Millisecond)),
	}
	sessions := DeriveSessions(events, nil)
	if len(sessions) != 2 || sessions[0].EventCount != 2 || sessions[1].EventCount != 1 {
		t.Fatalf("unexpected sessions: %#v", sessions)
	}
}

func TestDeriveSessionsUsesPreRangeEventOnlyForBoundary(t *testing.T) {
	base := time.Date(2026, time.July, 1, 0, 0, 0, 0, time.UTC)
	preceding := aggregationEvent(1, "abcdefghijklmnopqrstuv", EventPageView, OutcomeSuccess, base)
	events := []AnalyticsEvent{aggregationEvent(2, "abcdefghijklmnopqrstuv", EventPlaceQuery, OutcomeSuccess, base.Add(20*time.Minute))}
	sessions := DeriveSessions(events, &preceding)
	if len(sessions) != 1 || sessions[0].StartedAt != events[0].OccurredAt || sessions[0].Ordinal != 1 {
		t.Fatalf("pre-range event must not leak into returned detail: %#v", sessions)
	}
}

func TestOrderedFunnelsRequireSameSessionAndSequence(t *testing.T) {
	base := time.Date(2026, time.July, 1, 0, 0, 0, 0, time.UTC)
	events := []AnalyticsEvent{
		aggregationEvent(1, "abcdefghijklmnopqrstuv", EventPageView, OutcomeSuccess, base),
		aggregationEvent(2, "abcdefghijklmnopqrstuv", EventRouteQuery, OutcomeSuccess, base.Add(time.Minute)),
		aggregationEvent(3, "abcdefghijklmnopqrstuv", EventPlaceQuery, OutcomeSuccess, base.Add(2*time.Minute)),
		aggregationEvent(4, "0123456789abcdefghijkl", EventPageView, OutcomeSuccess, base),
		aggregationEvent(5, "0123456789abcdefghijkl", EventPlaceQuery, OutcomeSuccess, base.Add(time.Minute)),
		aggregationEvent(6, "0123456789abcdefghijkl", EventRouteQuery, OutcomeSuccess, base.Add(2*time.Minute)),
		aggregationEvent(7, "0123456789abcdefghijkl", EventDownloadRequest, OutcomeSuccess, base.Add(3*time.Minute)),
	}
	events[6].Download = &DownloadAttribution{Platform: PlatformAndroid, VersionName: "1.0", VersionCode: 1, SizeBytes: 100}
	trial := TrialFunnel(events)
	if got := []int64{trial.Stages[0].UniqueVisitors, trial.Stages[1].UniqueVisitors, trial.Stages[2].UniqueVisitors}; got[0] != 2 || got[1] != 2 || got[2] != 1 {
		t.Fatalf("unexpected ordered trial funnel: %#v", trial)
	}
	download := DownloadFunnel(events)
	if download.Stages[0].UniqueVisitors != 2 || download.Stages[1].UniqueVisitors != 1 {
		t.Fatalf("unexpected download funnel: %#v", download)
	}
}

func TestPreviousRangeIsAdjacentAndEqualLength(t *testing.T) {
	from := time.Date(2026, time.July, 1, 0, 0, 0, 0, time.UTC)
	to := from.Add(30 * 24 * time.Hour)
	previousFrom, previousTo := PreviousRange(from, to)
	if !previousTo.Equal(from) || previousTo.Sub(previousFrom) != to.Sub(from) {
		t.Fatalf("unexpected previous range: %s - %s", previousFrom, previousTo)
	}
}

func TestFillTimeBucketsIncludesMissingHongKongDays(t *testing.T) {
	location, err := time.LoadLocation("Asia/Hong_Kong")
	if err != nil {
		t.Fatal(err)
	}
	from := time.Date(2026, time.July, 1, 0, 0, 0, 0, location)
	buckets := TimeBuckets(from, from.Add(3*24*time.Hour), GranularityDay, location)
	if len(buckets) != 3 || !buckets[0].Start.Equal(from) || !buckets[2].End.Equal(from.Add(3*24*time.Hour)) {
		t.Fatalf("unexpected day buckets: %#v", buckets)
	}
}

func TestNearestRankPercentiles(t *testing.T) {
	values := []int64{50, 10, 40, 20, 30}
	p50 := NearestRank(values, 0.50)
	p95 := NearestRank(values, 0.95)
	if p50 == nil || *p50 != 30 || p95 == nil || *p95 != 50 {
		t.Fatalf("unexpected percentiles p50=%v p95=%v", p50, p95)
	}
	if NearestRank(nil, 0.5) != nil {
		t.Fatal("empty percentile must be nil")
	}
}

func aggregationEvent(id int64, visitor string, eventType EventType, outcome Outcome, occurredAt time.Time) AnalyticsEvent {
	status := 200
	return AnalyticsEvent{EventID: id, VisitorID: visitor, EventType: eventType, Outcome: outcome, HTTPStatus: &status, StatusClass: Status2xx, OccurredAt: occurredAt.UTC(), DurationMS: 10, Locale: LocaleZhHant, DeviceType: DeviceMobile, SourceType: SourceDirect}
}
