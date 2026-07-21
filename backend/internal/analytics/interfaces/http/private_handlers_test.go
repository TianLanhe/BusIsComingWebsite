package http

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

type detailsQueryStub struct {
	err error
}

func (stub detailsQueryStub) Traffic(context.Context, domain.AnalyticsQuery) (analyticsapp.TrafficData, error) {
	return analyticsapp.TrafficData{}, stub.err
}
func (stub detailsQueryStub) Downloads(context.Context, domain.AnalyticsQuery) (analyticsapp.DownloadsData, error) {
	return analyticsapp.DownloadsData{}, stub.err
}
func (stub detailsQueryStub) Events(context.Context, domain.AnalyticsQuery, string) (analyticsapp.EventListData, error) {
	return analyticsapp.EventListData{}, stub.err
}
func (stub detailsQueryStub) Visitor(context.Context, string, int, string) (analyticsapp.VisitorData, error) {
	return analyticsapp.VisitorData{}, stub.err
}
func (stub detailsQueryStub) Performance(context.Context, domain.AnalyticsQuery) (analyticsapp.PerformanceData, error) {
	return analyticsapp.PerformanceData{}, stub.err
}
func (stub detailsQueryStub) System(context.Context) analyticsapp.SystemData {
	return analyticsapp.SystemData{}
}

func TestPrivateHandlersRegisterSixReadOnlyOperationsWithNoStore(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := platformhttp.NewPrivateEngine(&bytes.Buffer{})
	RegisterPrivateRoutes(engine, nil, detailsQueryStub{}, "")
	query := "?from=2026-07-01T00%3A00%3A00Z&to=2026-07-02T00%3A00%3A00Z&granularity=day"
	for _, path := range []string{"/api/analytics/traffic", "/api/analytics/downloads", "/api/analytics/events", "/api/analytics/performance"} {
		response := httptest.NewRecorder()
		engine.ServeHTTP(response, httptest.NewRequest(http.MethodGet, path+query, nil))
		if response.Code != http.StatusOK || response.Header().Get("Cache-Control") != "no-store" {
			t.Fatalf("%s status=%d body=%s", path, response.Code, response.Body.String())
		}
	}
	system := httptest.NewRecorder()
	engine.ServeHTTP(system, httptest.NewRequest(http.MethodGet, "/api/analytics/system", nil))
	if system.Code != http.StatusOK || !strings.Contains(system.Body.String(), `"data"`) {
		t.Fatalf("system: %d %s", system.Code, system.Body.String())
	}
}

func TestPrivateHandlersRequireVisitorHeaderAndMapControlledErrors(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name, path string
		header     string
		err        error
		status     int
		code       string
	}{
		{"missing visitor", "/api/analytics/visitor", "", nil, 400, "ANALYTICS_INVALID_FILTER"},
		{"visitor missing", "/api/analytics/visitor", "abcdefghijklmnopqrstuv", analyticsapp.ErrVisitorNotFound, 404, "ANALYTICS_VISITOR_NOT_FOUND"},
		{"invalid cursor", "/api/analytics/events?from=2026-07-01T00%3A00%3A00Z&to=2026-07-02T00%3A00%3A00Z&cursor=bad", "", analyticsapp.ErrInvalidCursor, 400, "ANALYTICS_INVALID_CURSOR"},
		{"storage", "/api/analytics/traffic?from=2026-07-01T00%3A00%3A00Z&to=2026-07-02T00%3A00%3A00Z", "", analyticsapp.ErrStorageUnavailable, 503, "ANALYTICS_STORAGE_UNAVAILABLE"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			engine := platformhttp.NewPrivateEngine(&bytes.Buffer{})
			RegisterPrivateRoutes(engine, nil, detailsQueryStub{err: test.err}, "")
			request := httptest.NewRequest(http.MethodGet, test.path, nil)
			if test.header != "" {
				request.Header.Set("X-Analytics-Visitor-ID", test.header)
			}
			response := httptest.NewRecorder()
			engine.ServeHTTP(response, request)
			if response.Code != test.status || !strings.Contains(response.Body.String(), test.code) || response.Header().Get("Cache-Control") != "no-store" {
				t.Fatalf("status=%d body=%s", response.Code, response.Body.String())
			}
		})
	}
}
