package http

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

type overviewQueryFunc func(context.Context, domain.AnalyticsQuery) (analyticsapp.OverviewData, error)

func (function overviewQueryFunc) Execute(ctx context.Context, query domain.AnalyticsQuery) (analyticsapp.OverviewData, error) {
	return function(ctx, query)
}

func TestOverviewHandlerReturnsContractEnvelopeAndNoStore(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var captured domain.AnalyticsQuery
	handler := NewOverviewHandler(overviewQueryFunc(func(_ context.Context, query domain.AnalyticsQuery) (analyticsapp.OverviewData, error) {
		captured = query
		return analyticsapp.OverviewData{Meta: analyticsapp.AnalyticsMeta{State: domain.QueryReady}, Metrics: []domain.Metric{}}, nil
	}))
	engine := platformhttp.NewPrivateEngine(&bytes.Buffer{})
	engine.GET("/api/analytics/overview", handler.Get)
	request := httptest.NewRequest(http.MethodGet, "/api/analytics/overview?from=2026-07-01T00%3A00%3A00%2B08%3A00&to=2026-07-31T00%3A00%3A00%2B08%3A00&granularity=day&compare=true&locale=zh-Hant&locale=en&platform=android", nil)
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, request)
	if response.Code != http.StatusOK || response.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("unexpected response status/cache: %d %q", response.Code, response.Header().Get("Cache-Control"))
	}
	if !strings.Contains(response.Body.String(), `"data"`) || !strings.Contains(response.Body.String(), `"error":null`) || !strings.Contains(response.Body.String(), `"requestId"`) {
		t.Fatalf("unexpected envelope: %s", response.Body.String())
	}
	if len(captured.Locales) != 2 || len(captured.Platforms) != 1 || !captured.Compare {
		t.Fatalf("filters were not parsed: %#v", captured)
	}
}

func TestOverviewHandlerMapsInvalidQueryAndStorageUnavailable(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name       string
		query      string
		usecaseErr error
		status     int
		code       string
	}{
		{"invalid filter", "?from=invalid&to=invalid", nil, http.StatusBadRequest, "ANALYTICS_INVALID_FILTER"},
		{"storage unavailable", "?from=2026-07-01T00%3A00%3A00Z&to=2026-07-02T00%3A00%3A00Z&granularity=day", analyticsapp.ErrStorageUnavailable, http.StatusServiceUnavailable, "ANALYTICS_STORAGE_UNAVAILABLE"},
		{"query failed", "?from=2026-07-01T00%3A00%3A00Z&to=2026-07-02T00%3A00%3A00Z&granularity=day", errors.New("sql sentinel"), http.StatusInternalServerError, "ANALYTICS_QUERY_FAILED"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			handler := NewOverviewHandler(overviewQueryFunc(func(context.Context, domain.AnalyticsQuery) (analyticsapp.OverviewData, error) {
				return analyticsapp.OverviewData{}, test.usecaseErr
			}))
			engine := platformhttp.NewPrivateEngine(&bytes.Buffer{})
			engine.GET("/api/analytics/overview", handler.Get)
			response := httptest.NewRecorder()
			engine.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/analytics/overview"+test.query, nil))
			if response.Code != test.status || response.Header().Get("Cache-Control") != "no-store" || !strings.Contains(response.Body.String(), test.code) {
				t.Fatalf("unexpected error response: status=%d body=%s", response.Code, response.Body.String())
			}
			if strings.Contains(response.Body.String(), "sql sentinel") {
				t.Fatalf("raw error leaked: %s", response.Body.String())
			}
		})
	}
}
