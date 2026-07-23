package domain

import (
	"testing"
	"time"
)

func TestAnalyticsEventValidateAcceptsFourEventTypes(t *testing.T) {
	for _, eventType := range []EventType{EventPageView, EventPlaceQuery, EventRouteQuery, EventDownloadRequest} {
		event := validEvent(eventType)
		if err := event.Validate(); err != nil {
			t.Fatalf("expected %s to be valid: %v", eventType, err)
		}
	}
}

func TestAnalyticsEventValidateRejectsUnknownEnums(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*AnalyticsEvent)
	}{
		{"event type", func(event *AnalyticsEvent) { event.EventType = "eta_query" }},
		{"outcome", func(event *AnalyticsEvent) { event.Outcome = "maybe" }},
		{"status class", func(event *AnalyticsEvent) { event.StatusClass = "200" }},
		{"failure category", func(event *AnalyticsEvent) {
			value := FailureCategory("secret_error")
			event.Outcome = OutcomeFailure
			event.StatusClass = Status5xx
			event.HTTPStatus = intPointer(500)
			event.FailureCategory = &value
		}},
		{"locale", func(event *AnalyticsEvent) { event.Locale = "fr" }},
		{"device", func(event *AnalyticsEvent) { event.DeviceType = "watch" }},
		{"source", func(event *AnalyticsEvent) { event.SourceType = "email" }},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			event := validEvent(EventPageView)
			test.mutate(&event)
			if err := event.Validate(); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}
}

func TestAnalyticsEventValidateCrossFieldRules(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*AnalyticsEvent)
	}{
		{"success cannot have failure", func(event *AnalyticsEvent) { value := FailureInternal; event.FailureCategory = &value }},
		{"success must be 2xx", func(event *AnalyticsEvent) { event.HTTPStatus = intPointer(302); event.StatusClass = Status3xx }},
		{"failure needs category", func(event *AnalyticsEvent) {
			event.Outcome = OutcomeFailure
			event.HTTPStatus = intPointer(500)
			event.StatusClass = Status5xx
		}},
		{"aborted has no status", func(event *AnalyticsEvent) {
			event.Outcome = OutcomeFailure
			event.HTTPStatus = intPointer(500)
			event.StatusClass = StatusAborted
			value := FailureClientAborted
			event.FailureCategory = &value
		}},
		{"non download has no attribution", func(event *AnalyticsEvent) { event.Download = &DownloadAttribution{Platform: PlatformAndroid} }},
		{"download success needs actual metadata", func(event *AnalyticsEvent) {
			event.EventType = EventDownloadRequest
			event.Download = &DownloadAttribution{Platform: PlatformAndroid}
		}},
		{"invalid token only belongs to route", func(event *AnalyticsEvent) {
			event.EventType = EventPlaceQuery
			event.Outcome = OutcomeFailure
			event.HTTPStatus = intPointer(401)
			event.StatusClass = Status4xx
			value := FailureInvalidToken
			event.FailureCategory = &value
		}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			event := validEvent(EventPageView)
			test.mutate(&event)
			if err := event.Validate(); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}
}

func TestAnalyticsEventValidateRequiresUTCMilliseconds(t *testing.T) {
	event := validEvent(EventPageView)
	event.OccurredAt = event.OccurredAt.Add(time.Nanosecond)
	if err := event.Validate(); err == nil {
		t.Fatal("expected sub-millisecond timestamp to fail")
	}

	event = validEvent(EventPageView)
	event.OccurredAt = event.OccurredAt.In(time.FixedZone("HKT", 8*60*60))
	if err := event.Validate(); err == nil {
		t.Fatal("expected non-UTC timestamp to fail")
	}
}

func TestDownloadSuccessAcceptsActualAttribution(t *testing.T) {
	event := validEvent(EventDownloadRequest)
	if err := event.Validate(); err != nil {
		t.Fatalf("expected valid download event: %v", err)
	}
}

func validEvent(eventType EventType) AnalyticsEvent {
	event := AnalyticsEvent{
		OccurredAt:  time.UnixMilli(1_721_017_200_123).UTC(),
		VisitorID:   "abcdefghijklmnopqrstuv",
		EventType:   eventType,
		Outcome:     OutcomeSuccess,
		HTTPStatus:  intPointer(200),
		StatusClass: Status2xx,
		DurationMS:  15,
		Locale:      LocaleZhHant,
		DeviceType:  DeviceDesktop,
		SourceType:  SourceDirect,
	}
	if eventType == EventDownloadRequest {
		event.Download = &DownloadAttribution{
			Platform:    PlatformAndroid,
			VersionName: "1.2.3",
			VersionCode: 123,
			SizeBytes:   5_000_000,
		}
	}
	return event
}

func intPointer(value int) *int { return &value }
