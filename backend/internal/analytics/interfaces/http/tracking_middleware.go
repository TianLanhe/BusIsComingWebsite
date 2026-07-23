package http

import (
	"net/http"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
	"busiscoming-website/backend/internal/analytics/infrastructure/classification"
	"busiscoming-website/backend/internal/analytics/infrastructure/signing"
	"github.com/gin-gonic/gin"
)

const (
	HomeLocaleHeader    = "X-BusIsComing-Home-Locale"
	TrafficSourceHeader = "X-BusIsComing-Traffic-Source"
)

type TrackingConfig struct {
	Signer     *signing.VisitorCookieSigner
	Classifier *classification.Classifier
	Recorder   EventRecorder
	Clock      func() time.Time
}

func NewTrackingMiddleware(config TrackingConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		eventType, tracked := trackedEventType(c.Request.Method, c.Request.URL.Path)
		if !tracked || config.Signer == nil || config.Classifier == nil || config.Recorder == nil || config.Clock == nil {
			c.Next()
			return
		}

		// 完整 UA 只在这里做瞬时机器人判定，且判定必须早于 Cookie 读取、验证或签发。
		if config.Classifier.IsKnownBot(c.GetHeader("User-Agent")) {
			c.Next()
			return
		}
		homeLocale := config.Classifier.Locale(c.GetHeader(HomeLocaleHeader), "", "")
		if eventType == domain.EventPageView && !validHomepageLocale(c.GetHeader(HomeLocaleHeader), homeLocale) {
			c.Next()
			return
		}

		rawCookie, _ := c.Cookie(signing.VisitorCookieName)
		credential, err := config.Signer.Resolve(rawCookie)
		if err != nil {
			c.Next()
			return
		}
		if !credential.Reused {
			http.SetCookie(c.Writer, signing.VisitorCookie(credential.Value, credential.ExpiresAt, config.Clock().UTC()))
		}
		startedAt := config.Clock().UTC().Truncate(time.Millisecond)
		observation(c)
		c.Next()

		status := c.Writer.Status()
		outcome := domain.OutcomeFailure
		if status >= 200 && status <= 299 {
			outcome = domain.OutcomeSuccess
		}
		observed := observation(c)
		locale := homeLocale
		if observed.Locale != nil {
			locale = *observed.Locale
		} else if locale == domain.LocaleUnknown {
			locale = config.Classifier.Locale("", "", c.GetHeader("Accept-Language"))
		}
		event := domain.AnalyticsEvent{
			OccurredAt:  startedAt,
			VisitorID:   credential.VisitorID,
			EventType:   eventType,
			Outcome:     outcome,
			HTTPStatus:  &status,
			StatusClass: domain.StatusClassFor(status),
			DurationMS:  max(config.Clock().UTC().Sub(startedAt).Milliseconds(), 0),
			Locale:      locale,
			DeviceType:  config.Classifier.Device(c.GetHeader("User-Agent")),
			SourceType:  config.Classifier.Source(c.GetHeader(TrafficSourceHeader)),
		}
		if outcome == domain.OutcomeFailure {
			category := failureForStatus(status)
			if observed.FailureCategory != nil {
				category = *observed.FailureCategory
			}
			event.FailureCategory = &category
		}
		if eventType == domain.EventDownloadRequest {
			event.Download = &domain.DownloadAttribution{Platform: domain.PlatformAndroid}
			if observed.Download != nil {
				event.Download = observed.Download
			}
		}
		config.Recorder.Record(c.Request.Context(), event)
	}
}

func trackedEventType(method, path string) (domain.EventType, bool) {
	switch method + " " + path {
	case "GET /api/downloads/android/latest/metadata":
		return domain.EventPageView, true
	case "POST /api/routes/query_places":
		return domain.EventPlaceQuery, true
	case "POST /api/routes/query_routes":
		return domain.EventRouteQuery, true
	case "GET /api/downloads/android/latest":
		return domain.EventDownloadRequest, true
	default:
		return "", false
	}
}

func validHomepageLocale(raw string, locale domain.Locale) bool {
	return (raw == string(domain.LocaleZhHant) || raw == string(domain.LocaleZhHans) || raw == string(domain.LocaleEnglish)) && locale != domain.LocaleUnknown
}

func failureForStatus(status int) domain.FailureCategory {
	switch status {
	case http.StatusBadRequest, http.StatusUnauthorized, http.StatusForbidden, http.StatusUnprocessableEntity:
		return domain.FailureInvalidRequest
	case http.StatusNotFound:
		return domain.FailureNotFound
	case http.StatusConflict:
		return domain.FailureIntegrityMismatch
	case http.StatusTooManyRequests:
		return domain.FailureRateLimited
	case http.StatusGatewayTimeout:
		return domain.FailureExternalTimeout
	case http.StatusBadGateway, http.StatusServiceUnavailable:
		return domain.FailureExternalUnavailable
	default:
		if status >= 500 {
			return domain.FailureInternal
		}
		return domain.FailureUnknown
	}
}
