package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	analyticsapp "busiscoming-website/backend/internal/analytics/application"
	"busiscoming-website/backend/internal/analytics/domain"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

type detailsQueryStub struct {
	err         error
	traffic     analyticsapp.TrafficData
	events      analyticsapp.EventListData
	visitor     analyticsapp.VisitorData
	performance analyticsapp.PerformanceData
}

func (stub detailsQueryStub) Traffic(context.Context, domain.AnalyticsQuery) (analyticsapp.TrafficData, error) {
	return stub.traffic, stub.err
}

type overviewQueryStub struct{ data analyticsapp.OverviewData }

func (stub overviewQueryStub) Execute(context.Context, domain.AnalyticsQuery) (analyticsapp.OverviewData, error) {
	return stub.data, nil
}
func (stub detailsQueryStub) Downloads(context.Context, domain.AnalyticsQuery) (analyticsapp.DownloadsData, error) {
	return analyticsapp.DownloadsData{}, stub.err
}
func (stub detailsQueryStub) Events(context.Context, domain.AnalyticsQuery, string) (analyticsapp.EventListData, error) {
	return stub.events, stub.err
}
func (stub detailsQueryStub) Visitor(context.Context, string, int, string) (analyticsapp.VisitorData, error) {
	return stub.visitor, stub.err
}

func TestPrivateEventAndVisitorResponsesExposeOnly011ContractFields(t *testing.T) {
	gin.SetMode(gin.TestMode)
	visitorID := "abcdefghijklmnopqrstuv"
	platform := domain.PlatformAndroid
	stub := detailsQueryStub{
		events: analyticsapp.EventListData{
			Summary:  analyticsapp.EventRangeSummary{TotalCount: 4, SuccessCount: 3, FailureCount: 1, UniqueVisitors: 2},
			PageInfo: analyticsapp.PageInfo{Limit: 50, TotalCount: 4},
		},
		visitor: analyticsapp.VisitorData{Visitor: analyticsapp.VisitorSummaryData{
			VisitorID: visitorID, EventCount: 4, SessionCount: 2,
			EventComposition: []domain.DistributionItem{{Key: string(domain.EventPageView), Count: 4}},
			CommonPlatform:   &platform,
		}},
	}
	engine := platformhttp.NewPrivateEngine(&bytes.Buffer{})
	RegisterPrivateRoutes(engine, nil, stub, "")
	query := "?from=2026-07-01T00%3A00%3A00Z&to=2026-07-02T00%3A00%3A00Z&granularity=day"

	eventsResponse := httptest.NewRecorder()
	engine.ServeHTTP(eventsResponse, httptest.NewRequest(http.MethodGet, "/api/analytics/events"+query, nil))
	if eventsResponse.Code != http.StatusOK || !strings.Contains(eventsResponse.Body.String(), `"summary"`) || !strings.Contains(eventsResponse.Body.String(), `"uniqueVisitors":2`) {
		t.Fatalf("events response does not match 011: %d %s", eventsResponse.Code, eventsResponse.Body.String())
	}

	visitorRequest := httptest.NewRequest(http.MethodGet, "/api/analytics/visitor?limit=50", nil)
	visitorRequest.Header.Set("X-Analytics-Visitor-ID", visitorID)
	visitorResponse := httptest.NewRecorder()
	engine.ServeHTTP(visitorResponse, visitorRequest)
	if visitorResponse.Code != http.StatusOK || !strings.Contains(visitorResponse.Body.String(), `"eventComposition"`) || !strings.Contains(visitorResponse.Body.String(), `"commonPlatform":"android"`) {
		t.Fatalf("visitor response does not match 011: %d %s", visitorResponse.Code, visitorResponse.Body.String())
	}
	for _, forbidden := range []string{"ipAddress", "userAgent", "referrer", "queryText", "coordinates"} {
		if strings.Contains(eventsResponse.Body.String()+visitorResponse.Body.String(), forbidden) {
			t.Fatalf("sensitive field %s leaked", forbidden)
		}
	}

	queryOnly := httptest.NewRecorder()
	engine.ServeHTTP(queryOnly, httptest.NewRequest(http.MethodGet, "/api/analytics/visitor?visitorId="+visitorID, nil))
	if queryOnly.Code != http.StatusBadRequest {
		t.Fatalf("visitor ID query parameter must not replace private header: %d %s", queryOnly.Code, queryOnly.Body.String())
	}
}
func (stub detailsQueryStub) Performance(context.Context, domain.AnalyticsQuery) (analyticsapp.PerformanceData, error) {
	return stub.performance, stub.err
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

func TestPerformanceResponseKeepsEnvelopeAndExposes012SLIFields(t *testing.T) {
	gin.SetMode(gin.TestMode)
	current, previous, delta := int64(120), int64(100), int64(20)
	previousOnly := int64(480)
	engine := platformhttp.NewPrivateEngine(&bytes.Buffer{})
	RegisterPrivateRoutes(engine, nil, detailsQueryStub{performance: analyticsapp.PerformanceData{
		Endpoints: []analyticsapp.EndpointPerformance{
			{OperationID: "queryRouteOptions", EventType: domain.EventRouteQuery, P50Comparison: analyticsapp.PercentileComparison{CurrentMS: &current, PreviousMS: &previous, DeltaMS: &delta}},
			{OperationID: "downloadLatestAndroidApk", EventType: domain.EventDownloadRequest, P95Comparison: analyticsapp.PercentileComparison{CurrentMS: nil, PreviousMS: &previousOnly, DeltaMS: nil, DeltaRate: nil}},
		},
		SLISeries: []analyticsapp.SLISeriesPoint{{EventType: domain.EventPageView, SuccessfulPV: 0, TotalPV: 0, SuccessRate: nil}},
	}}, "")
	query := "?from=2026-07-01T00%3A00%3A00Z&to=2026-07-02T00%3A00%3A00Z&granularity=day"
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/analytics/performance"+query, nil))
	if response.Code != http.StatusOK || response.Header().Get("Cache-Control") != "no-store" || !strings.Contains(response.Body.String(), `"sliSeries"`) {
		t.Fatalf("012 performance envelope missing SLI field: status=%d body=%s", response.Code, response.Body.String())
	}
	var envelope struct {
		Data struct {
			Endpoints []struct {
				OperationID   string         `json:"operationId"`
				P50Comparison map[string]any `json:"p50Comparison"`
				P95Comparison map[string]any `json:"p95Comparison"`
			} `json:"endpoints"`
		} `json:"data"`
		Error any `json:"error"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &envelope); err != nil {
		t.Fatal(err)
	}
	if envelope.Error != nil || len(envelope.Data.Endpoints) != 2 || envelope.Data.Endpoints[0].OperationID != "queryRouteOptions" || envelope.Data.Endpoints[1].OperationID != "downloadLatestAndroidApk" {
		t.Fatalf("performance envelope lost operation IDs: %s", response.Body.String())
	}
	if envelope.Data.Endpoints[0].P50Comparison["currentMs"] != float64(120) || envelope.Data.Endpoints[0].P50Comparison["previousMs"] != float64(100) || envelope.Data.Endpoints[1].P95Comparison["currentMs"] != nil || envelope.Data.Endpoints[1].P95Comparison["previousMs"] != float64(480) || envelope.Data.Endpoints[1].P95Comparison["deltaMs"] != nil {
		t.Fatalf("performance comparison null semantics changed: %s", response.Body.String())
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
		{"performance storage", "/api/analytics/performance?from=2026-07-01T00%3A00%3A00Z&to=2026-07-02T00%3A00%3A00Z", "", analyticsapp.ErrStorageUnavailable, 503, "ANALYTICS_STORAGE_UNAVAILABLE"},
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

func TestPrivateHandlersSerializeOnlyThe011DailyHeatmapAndEventLatencyFields(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := platformhttp.NewPrivateEngine(&bytes.Buffer{})
	location := time.FixedZone("Asia/Hong_Kong", 8*60*60)
	start := time.Date(2026, time.July, 23, 0, 0, 0, 0, location)
	p95 := int64(42)
	RegisterPrivateRoutes(
		engine,
		overviewQueryStub{data: analyticsapp.OverviewData{LatencyByEvent: []analyticsapp.EventLatencySummary{{EventType: domain.EventPageView, RequestCount: 1, P95MS: &p95}}}},
		detailsQueryStub{traffic: analyticsapp.TrafficData{Heatmap: []analyticsapp.HeatmapCell{{
			LocalDate: "2026-07-23", BucketStart: start, BucketEnd: start.Add(24 * time.Hour), EventCount: 2, UV: 1,
		}}}},
		"",
	)
	query := "?from=2026-07-23T00%3A00%3A00%2B08%3A00&to=2026-07-24T00%3A00%3A00%2B08%3A00&granularity=day"
	for _, test := range []struct {
		path     string
		required string
	}{
		{"/api/analytics/overview", "latencyByEvent"},
		{"/api/analytics/traffic", "heatmap"},
	} {
		response := httptest.NewRecorder()
		engine.ServeHTTP(response, httptest.NewRequest(http.MethodGet, test.path+query, nil))
		if response.Code != http.StatusOK {
			t.Fatalf("%s status=%d body=%s", test.path, response.Code, response.Body.String())
		}
		var envelope map[string]any
		if err := json.Unmarshal(response.Body.Bytes(), &envelope); err != nil {
			t.Fatal(err)
		}
		data, ok := envelope["data"].(map[string]any)
		if !ok || data[test.required] == nil {
			t.Fatalf("%s missing %s: %s", test.path, test.required, response.Body.String())
		}
		if strings.Contains(response.Body.String(), "\"weekday\"") || strings.Contains(response.Body.String(), "\"hour\"") {
			t.Fatalf("legacy heatmap fields leaked: %s", response.Body.String())
		}
		for _, forbidden := range []string{"ipAddress", "userAgent", "referrer", "queryText"} {
			if strings.Contains(response.Body.String(), forbidden) {
				t.Fatalf("sensitive field %s leaked: %s", forbidden, response.Body.String())
			}
		}
	}
}
