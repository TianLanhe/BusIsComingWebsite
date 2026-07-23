package domain

type EventType string

const (
	EventPageView        EventType = "page_view"
	EventPlaceQuery      EventType = "place_query"
	EventRouteQuery      EventType = "route_query"
	EventDownloadRequest EventType = "download_request"
)

type Outcome string

const (
	OutcomeSuccess Outcome = "success"
	OutcomeFailure Outcome = "failure"
)

type StatusClass string

const (
	Status2xx     StatusClass = "2xx"
	Status3xx     StatusClass = "3xx"
	Status4xx     StatusClass = "4xx"
	Status5xx     StatusClass = "5xx"
	StatusAborted StatusClass = "aborted"
	StatusUnknown StatusClass = "unknown"
)

type FailureCategory string

const (
	FailureInvalidRequest      FailureCategory = "invalid_request"
	FailureInvalidToken        FailureCategory = "invalid_token"
	FailureSamePlace           FailureCategory = "same_place"
	FailureRateLimited         FailureCategory = "rate_limited"
	FailureNotFound            FailureCategory = "not_found"
	FailureIntegrityMismatch   FailureCategory = "integrity_mismatch"
	FailureExternalTimeout     FailureCategory = "external_timeout"
	FailureExternalUnavailable FailureCategory = "external_unavailable"
	FailureClientAborted       FailureCategory = "client_aborted"
	FailureInternal            FailureCategory = "internal"
	FailureUnknown             FailureCategory = "unknown"
)

type Locale string

const (
	LocaleZhHant  Locale = "zh-Hant"
	LocaleZhHans  Locale = "zh-Hans"
	LocaleEnglish Locale = "en"
	LocaleUnknown Locale = "unknown"
)

type DeviceType string

const (
	DeviceDesktop DeviceType = "desktop"
	DeviceMobile  DeviceType = "mobile"
	DeviceTablet  DeviceType = "tablet"
	DeviceOther   DeviceType = "other"
)

type SourceType string

const (
	SourceDirect   SourceType = "direct"
	SourceSearch   SourceType = "search"
	SourceReferral SourceType = "referral"
	SourceInternal SourceType = "internal"
	SourceUnknown  SourceType = "unknown"
)

type Platform string

const (
	PlatformAndroid Platform = "android"
	PlatformIOS     Platform = "ios"
	PlatformOther   Platform = "other"
)

func IsEventType(value EventType) bool {
	return value == EventPageView || value == EventPlaceQuery || value == EventRouteQuery || value == EventDownloadRequest
}

func IsOutcome(value Outcome) bool { return value == OutcomeSuccess || value == OutcomeFailure }

func IsStatusClass(value StatusClass) bool {
	return value == Status2xx || value == Status3xx || value == Status4xx || value == Status5xx || value == StatusAborted || value == StatusUnknown
}

func IsFailureCategory(value FailureCategory) bool {
	switch value {
	case FailureInvalidRequest, FailureInvalidToken, FailureSamePlace, FailureRateLimited,
		FailureNotFound, FailureIntegrityMismatch, FailureExternalTimeout,
		FailureExternalUnavailable, FailureClientAborted, FailureInternal, FailureUnknown:
		return true
	default:
		return false
	}
}

func IsLocale(value Locale) bool {
	return value == LocaleZhHant || value == LocaleZhHans || value == LocaleEnglish || value == LocaleUnknown
}

func IsDeviceType(value DeviceType) bool {
	return value == DeviceDesktop || value == DeviceMobile || value == DeviceTablet || value == DeviceOther
}

func IsSourceType(value SourceType) bool {
	return value == SourceDirect || value == SourceSearch || value == SourceReferral || value == SourceInternal || value == SourceUnknown
}

func IsPlatform(value Platform) bool {
	return value == PlatformAndroid || value == PlatformIOS || value == PlatformOther
}

func StatusClassFor(status int) StatusClass {
	switch {
	case status >= 200 && status <= 299:
		return Status2xx
	case status >= 300 && status <= 399:
		return Status3xx
	case status >= 400 && status <= 499:
		return Status4xx
	case status >= 500 && status <= 599:
		return Status5xx
	default:
		return StatusUnknown
	}
}
