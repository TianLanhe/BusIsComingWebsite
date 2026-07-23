package http

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"busiscoming-website/backend/internal/analytics/domain"
	"github.com/gin-gonic/gin"
)

func TestPublicTrackingRecordsExactRoutesAndOutcomesOnce(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var events []domain.AnalyticsEvent
	engine := trackedEngine(&bytes.Buffer{}, recorderFunc(func(_ context.Context, event domain.AnalyticsEvent) { events = append(events, event) }))
	registerSyntheticTrackingRoutes(engine)

	tests := []struct {
		name            string
		method          string
		path            string
		caseName        string
		homeLocale      string
		expectedType    domain.EventType
		expectedOutcome domain.Outcome
		expectedFailure *domain.FailureCategory
		expectedDelta   int
	}{
		{"metadata success", http.MethodGet, "/api/downloads/android/latest/metadata", "success", "zh-Hant", domain.EventPageView, domain.OutcomeSuccess, nil, 1},
		{"metadata failure", http.MethodGet, "/api/downloads/android/latest/metadata", "not_found", "en", domain.EventPageView, domain.OutcomeFailure, failurePointer(domain.FailureNotFound), 1},
		{"place invalid JSON", http.MethodPost, "/api/routes/query_places", "invalid", "", domain.EventPlaceQuery, domain.OutcomeFailure, failurePointer(domain.FailureInvalidRequest), 1},
		{"place limited", http.MethodPost, "/api/routes/query_places", "limited", "", domain.EventPlaceQuery, domain.OutcomeFailure, failurePointer(domain.FailureRateLimited), 1},
		{"route invalid token", http.MethodPost, "/api/routes/query_routes", "token", "", domain.EventRouteQuery, domain.OutcomeFailure, failurePointer(domain.FailureInvalidToken), 1},
		{"route upstream", http.MethodPost, "/api/routes/query_routes", "upstream", "", domain.EventRouteQuery, domain.OutcomeFailure, failurePointer(domain.FailureExternalUnavailable), 1},
		{"route panic", http.MethodPost, "/api/routes/query_routes", "panic", "", domain.EventRouteQuery, domain.OutcomeFailure, failurePointer(domain.FailureInternal), 1},
		{"route success", http.MethodPost, "/api/routes/query_routes", "success", "", domain.EventRouteQuery, domain.OutcomeSuccess, nil, 1},
		{"download success", http.MethodGet, "/api/downloads/android/latest", "success", "", domain.EventDownloadRequest, domain.OutcomeSuccess, nil, 1},
		{"download failure", http.MethodGet, "/api/downloads/android/latest", "not_found", "", domain.EventDownloadRequest, domain.OutcomeFailure, failurePointer(domain.FailureNotFound), 1},
		{"ETA excluded", http.MethodPost, "/api/routes/query_etas", "success", "", "", "", nil, 0},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			before := len(events)
			request := httptest.NewRequest(test.method, test.path, nil)
			request.Header.Set("X-Test-Case", test.caseName)
			request.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126 Safari/537.36")
			if test.homeLocale != "" {
				request.Header.Set(HomeLocaleHeader, test.homeLocale)
			}
			response := httptest.NewRecorder()
			engine.ServeHTTP(response, request)
			if len(events)-before != test.expectedDelta {
				t.Fatalf("expected event delta %d, got %d", test.expectedDelta, len(events)-before)
			}
			if test.expectedDelta == 0 {
				return
			}
			event := events[len(events)-1]
			if event.EventType != test.expectedType || event.Outcome != test.expectedOutcome {
				t.Fatalf("unexpected event: %#v", event)
			}
			if !sameFailure(event.FailureCategory, test.expectedFailure) {
				t.Fatalf("unexpected failure category: %#v", event.FailureCategory)
			}
			if err := event.Validate(); err != nil {
				t.Fatalf("recorded event is invalid: %v", err)
			}
		})
	}
}

func registerSyntheticTrackingRoutes(engine *gin.Engine) {
	handler := func(c *gin.Context) {
		switch c.GetHeader("X-Test-Case") {
		case "invalid":
			ObserveFailure(c, domain.FailureInvalidRequest)
			c.Status(http.StatusBadRequest)
		case "limited":
			ObserveFailure(c, domain.FailureRateLimited)
			c.Status(http.StatusTooManyRequests)
		case "token":
			ObserveFailure(c, domain.FailureInvalidToken)
			c.Status(http.StatusUnprocessableEntity)
		case "upstream":
			ObserveFailure(c, domain.FailureExternalUnavailable)
			c.Status(http.StatusBadGateway)
		case "not_found":
			ObserveFailure(c, domain.FailureNotFound)
			c.Status(http.StatusNotFound)
		case "panic":
			panic("controlled synthetic panic")
		default:
			if c.FullPath() == "/api/downloads/android/latest" {
				ObserveDownload(c, domain.DownloadAttribution{Platform: domain.PlatformAndroid, VersionName: "1.2.3", VersionCode: 123, SizeBytes: 5_000_000})
			}
			c.Status(http.StatusOK)
		}
	}
	engine.GET("/api/downloads/android/latest/metadata", handler)
	engine.POST("/api/routes/query_places", handler)
	engine.POST("/api/routes/query_routes", handler)
	engine.POST("/api/routes/query_etas", handler)
	engine.GET("/api/downloads/android/latest", handler)
}

func failurePointer(value domain.FailureCategory) *domain.FailureCategory { return &value }

func sameFailure(left, right *domain.FailureCategory) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}
