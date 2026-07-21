package domain

import (
	"regexp"
	"time"
)

var visitorIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{22}$`)

type DownloadAttribution struct {
	Platform    Platform
	VersionName string
	VersionCode int64
	SizeBytes   int64
}

type AnalyticsEvent struct {
	EventID         int64
	OccurredAt      time.Time
	VisitorID       string
	EventType       EventType
	Outcome         Outcome
	HTTPStatus      *int
	StatusClass     StatusClass
	FailureCategory *FailureCategory
	DurationMS      int64
	Locale          Locale
	DeviceType      DeviceType
	SourceType      SourceType
	Download        *DownloadAttribution
}

func (event AnalyticsEvent) Validate() error {
	if event.OccurredAt.Location() != time.UTC || event.OccurredAt.Nanosecond()%int(time.Millisecond) != 0 {
		return invalid("occurredAt", "must_be_utc_milliseconds")
	}
	if !visitorIDPattern.MatchString(event.VisitorID) {
		return invalid("visitorId", "invalid_format")
	}
	if !IsEventType(event.EventType) {
		return invalid("eventType", "unsupported")
	}
	if !IsOutcome(event.Outcome) {
		return invalid("outcome", "unsupported")
	}
	if !IsStatusClass(event.StatusClass) {
		return invalid("statusClass", "unsupported")
	}
	if event.FailureCategory != nil && !IsFailureCategory(*event.FailureCategory) {
		return invalid("failureCategory", "unsupported")
	}
	if event.DurationMS < 0 {
		return invalid("durationMs", "must_be_non_negative")
	}
	if !IsLocale(event.Locale) || !IsDeviceType(event.DeviceType) || !IsSourceType(event.SourceType) {
		return invalid("classification", "unsupported")
	}
	if err := event.validateResponse(); err != nil {
		return err
	}
	return event.validateDownload()
}

func (event AnalyticsEvent) validateResponse() error {
	if event.HTTPStatus != nil && (*event.HTTPStatus < 100 || *event.HTTPStatus > 599) {
		return invalid("httpStatus", "out_of_range")
	}
	if event.Outcome == OutcomeSuccess {
		if event.HTTPStatus == nil || event.StatusClass != Status2xx || StatusClassFor(*event.HTTPStatus) != Status2xx {
			return invalid("outcome", "success_requires_2xx")
		}
		if event.FailureCategory != nil {
			return invalid("failureCategory", "must_be_empty_on_success")
		}
		return nil
	}
	if event.FailureCategory == nil {
		return invalid("failureCategory", "required_on_failure")
	}
	if *event.FailureCategory == FailureInvalidToken && event.EventType != EventRouteQuery {
		return invalid("failureCategory", "invalid_token_requires_route_query")
	}
	if event.HTTPStatus == nil {
		if event.StatusClass != StatusAborted {
			return invalid("statusClass", "missing_status_requires_aborted")
		}
		return nil
	}
	if event.StatusClass == StatusAborted || event.StatusClass != StatusClassFor(*event.HTTPStatus) {
		return invalid("statusClass", "does_not_match_http_status")
	}
	return nil
}

func (event AnalyticsEvent) validateDownload() error {
	if event.EventType != EventDownloadRequest {
		if event.Download != nil {
			return invalid("download", "forbidden_for_event_type")
		}
		return nil
	}
	if event.Download == nil {
		if event.Outcome == OutcomeSuccess {
			return invalid("download", "required_on_success")
		}
		return nil
	}
	if !IsPlatform(event.Download.Platform) {
		return invalid("download.platform", "unsupported")
	}
	if len(event.Download.VersionName) > 64 {
		return invalid("download.versionName", "too_long")
	}
	if event.Outcome == OutcomeSuccess && (event.Download.VersionName == "" || event.Download.VersionCode <= 0 || event.Download.SizeBytes <= 0) {
		return invalid("download", "actual_metadata_required_on_success")
	}
	if event.Download.VersionCode < 0 || event.Download.SizeBytes < 0 {
		return invalid("download", "negative_value")
	}
	return nil
}
