package http

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
	analyticsqlite "busiscoming-website/backend/internal/analytics/infrastructure/sqlite"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

func TestPrivacySentinelsNeverReachLogsOrEvents(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var logs bytes.Buffer
	var events []domain.AnalyticsEvent
	engine := trackedEngine(&logs, recorderFunc(func(_ context.Context, event domain.AnalyticsEvent) { events = append(events, event) }))
	engine.POST("/api/routes/query_routes", func(c *gin.Context) {
		ObserveLocale(c, domain.LocaleEnglish)
		panic("panic-sentinel-9182")
	})

	request := httptest.NewRequest(http.MethodPost, "/api/routes/query_routes?query-sentinel-1734", strings.NewReader(`{"origin":"place-sentinel-5412","lat":22.33,"token":"token-sentinel-7751"}`))
	request.RemoteAddr = "203.0.113.218:48100"
	request.Header.Set("User-Agent", "Mozilla/5.0 privacy-ua-sentinel-2863 Safari/537.36")
	request.Header.Set("Referer", "https://referrer-sentinel-6650.example/path")
	request.Header.Set("Cookie", "other=cookie-sentinel-4821")
	request.Header.Set("X-Request-ID", "client-request-sentinel-3908")
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, request)

	combined := logs.String() + response.Body.String() + fmt.Sprintf("%#v", events)
	for _, forbidden := range []string{
		"203.0.113.218", "query-sentinel-1734", "place-sentinel-5412", "22.33",
		"token-sentinel-7751", "privacy-ua-sentinel-2863", "referrer-sentinel-6650",
		"cookie-sentinel-4821", "client-request-sentinel-3908", "panic-sentinel-9182",
	} {
		if strings.Contains(combined, forbidden) {
			t.Fatalf("privacy sentinel %q leaked: %s", forbidden, combined)
		}
	}
	if len(events) != 1 || events[0].EventType != domain.EventRouteQuery || events[0].Outcome != domain.OutcomeFailure {
		t.Fatalf("expected one bounded failure event: %#v", events)
	}
}

func TestPrivacySentinelsNeverReachSQLiteWALOrSHM(t *testing.T) {
	databasePath := filepath.Join(t.TempDir(), "analytics.sqlite")
	store, err := analyticsqlite.Open(context.Background(), databasePath)
	if err != nil {
		t.Fatal(err)
	}
	health := analyticsapp.NewRuntimeHealth(time.Now())
	recorder := analyticsapp.NewRecordEvent(store, 50*time.Millisecond, health)
	var logs bytes.Buffer
	engine := trackedEngine(&logs, recorder)
	engine.POST("/api/routes/query_places", func(c *gin.Context) {
		ObserveLocale(c, domain.LocaleZhHant)
		c.Status(http.StatusOK)
	})
	request := httptest.NewRequest(http.MethodPost, "/api/routes/query_places?sqlite-query-sentinel-1827", strings.NewReader("sqlite-body-sentinel-9521"))
	request.RemoteAddr = "198.51.100.47:5555"
	request.Header.Set("User-Agent", "Mozilla/5.0 sqlite-ua-sentinel-6143 Macintosh Safari/537.36")
	request.Header.Set("Cookie", "unrelated=sqlite-cookie-sentinel-7284")
	engine.ServeHTTP(httptest.NewRecorder(), request)

	clock := analyticsapp.ClockFunc(time.Now)
	privateEngine := platformhttp.NewPrivateEngine(&logs)
	RegisterPrivateRoutes(
		privateEngine,
		analyticsapp.NewQueryOverview(store, clock),
		analyticsapp.NewQueryDetails(store, health, clock, nil),
		"",
	)
	values := url.Values{
		"from":        []string{time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)},
		"to":          []string{time.Now().Add(time.Hour).UTC().Format(time.RFC3339)},
		"granularity": []string{"hour"},
	}
	privateResponse := httptest.NewRecorder()
	privateEngine.ServeHTTP(privateResponse, httptest.NewRequest(http.MethodGet, "/api/analytics/events?"+values.Encode(), nil))
	if err := store.Close(); err != nil {
		t.Fatal(err)
	}

	files, err := filepath.Glob(databasePath + "*")
	if err != nil {
		t.Fatal(err)
	}
	for _, path := range files {
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		for _, forbidden := range []string{"sqlite-query-sentinel-1827", "sqlite-body-sentinel-9521", "198.51.100.47", "sqlite-ua-sentinel-6143", "sqlite-cookie-sentinel-7284"} {
			if bytes.Contains(content, []byte(forbidden)) || strings.Contains(logs.String(), forbidden) || strings.Contains(privateResponse.Body.String(), forbidden) {
				t.Fatalf("privacy sentinel %q leaked through %s", forbidden, path)
			}
		}
	}
}
