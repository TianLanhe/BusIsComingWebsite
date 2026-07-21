package http

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
	"busiscoming-website/backend/internal/analytics/infrastructure/classification"
	"busiscoming-website/backend/internal/analytics/infrastructure/signing"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

type recorderFunc func(context.Context, domain.AnalyticsEvent)

func (function recorderFunc) Record(ctx context.Context, event domain.AnalyticsEvent) {
	function(ctx, event)
}

func TestTrackingExcludesBotBeforeCookieAndEvent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var events []domain.AnalyticsEvent
	var logs bytes.Buffer
	engine := trackedEngine(&logs, recorderFunc(func(_ context.Context, event domain.AnalyticsEvent) { events = append(events, event) }))
	engine.GET("/api/downloads/android/latest/metadata", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"ok": true}) })

	request := httptest.NewRequest(http.MethodGet, "/api/downloads/android/latest/metadata", nil)
	request.Header.Set(HomeLocaleHeader, "zh-Hant")
	request.Header.Set("User-Agent", "Mozilla/5.0 (compatible; Googlebot/2.1)")
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, request)
	if len(events) != 0 || response.Header().Get("Set-Cookie") != "" {
		t.Fatalf("bot must have no event or cookie: events=%d cookie=%q", len(events), response.Header().Get("Set-Cookie"))
	}
	if !strings.Contains(logs.String(), `"event":"http_request"`) || strings.Contains(strings.ToLower(logs.String()), "bot") {
		t.Fatalf("bot should produce only the generic log schema: %s", logs.String())
	}
}

func TestTrackingRequiresValidHomepageContextAndUsesWhitelistObservation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var events []domain.AnalyticsEvent
	engine := trackedEngine(&bytes.Buffer{}, recorderFunc(func(_ context.Context, event domain.AnalyticsEvent) { events = append(events, event) }))
	engine.GET("/api/downloads/android/latest/metadata", func(c *gin.Context) { c.Status(http.StatusServiceUnavailable) })
	engine.POST("/api/routes/query_places", func(c *gin.Context) {
		ObserveLocale(c, domain.LocaleZhHans)
		ObserveFailure(c, domain.FailureInvalidRequest)
		c.Status(http.StatusBadRequest)
	})

	withoutContext := httptest.NewRecorder()
	engine.ServeHTTP(withoutContext, httptest.NewRequest(http.MethodGet, "/api/downloads/android/latest/metadata", nil))
	if len(events) != 0 || withoutContext.Header().Get("Set-Cookie") != "" {
		t.Fatal("direct metadata calls must not create homepage analytics")
	}

	request := httptest.NewRequest(http.MethodPost, "/api/routes/query_places", strings.NewReader("sensitive body"))
	request.Header.Set(TrafficSourceHeader, "search")
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, request)
	if len(events) != 1 {
		t.Fatalf("expected one event, got %d", len(events))
	}
	event := events[0]
	if event.EventType != domain.EventPlaceQuery || event.Locale != domain.LocaleZhHans || event.SourceType != domain.SourceSearch || event.FailureCategory == nil || *event.FailureCategory != domain.FailureInvalidRequest {
		t.Fatalf("unexpected bounded event: %#v", event)
	}
	if response.Header().Get("Set-Cookie") == "" {
		t.Fatal("tracked browser request must receive a visitor cookie")
	}
}

func TestTrackingReusesAndRotatesVisitorCookie(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var events []domain.AnalyticsEvent
	engine := trackedEngine(&bytes.Buffer{}, recorderFunc(func(_ context.Context, event domain.AnalyticsEvent) { events = append(events, event) }))
	engine.POST("/api/routes/query_places", func(c *gin.Context) { c.Status(http.StatusOK) })

	first := httptest.NewRecorder()
	engine.ServeHTTP(first, httptest.NewRequest(http.MethodPost, "/api/routes/query_places", nil))
	issued := first.Result().Cookies()
	if len(issued) != 1 {
		t.Fatalf("expected one visitor cookie, got %#v", issued)
	}

	secondRequest := httptest.NewRequest(http.MethodPost, "/api/routes/query_places", nil)
	secondRequest.AddCookie(issued[0])
	second := httptest.NewRecorder()
	engine.ServeHTTP(second, secondRequest)
	if second.Header().Get("Set-Cookie") != "" || events[0].VisitorID != events[1].VisitorID {
		t.Fatalf("valid visitor cookie was not reused: cookie=%q events=%#v", second.Header().Get("Set-Cookie"), events)
	}

	tampered := *issued[0]
	tampered.Value += "tampered"
	thirdRequest := httptest.NewRequest(http.MethodPost, "/api/routes/query_places", nil)
	thirdRequest.AddCookie(&tampered)
	third := httptest.NewRecorder()
	engine.ServeHTTP(third, thirdRequest)
	if third.Header().Get("Set-Cookie") == "" || events[2].VisitorID == events[1].VisitorID {
		t.Fatalf("tampered visitor cookie was not rotated: cookie=%q events=%#v", third.Header().Get("Set-Cookie"), events)
	}
}

func trackedEngine(logOutput *bytes.Buffer, recorder EventRecorder) *gin.Engine {
	now := time.Date(2026, time.July, 22, 10, 0, 0, 0, time.UTC)
	randomValues := make([]byte, 4096)
	for index := range randomValues {
		randomValues[index] = byte(index)
	}
	signer := signing.NewVisitorCookieSigner(
		[]byte("0123456789abcdef0123456789abcdef"),
		func() time.Time { return now },
		bytes.NewReader(randomValues),
	)
	tracking := NewTrackingMiddleware(TrackingConfig{
		Signer:     signer,
		Classifier: classification.NewClassifier(),
		Recorder:   recorder,
		Clock:      func() time.Time { return now },
	})
	return platformhttp.NewPublicEngine(logOutput, tracking)
}
