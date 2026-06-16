package http_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	routeapp "busiscoming-website/backend/internal/routes/application"
	"busiscoming-website/backend/internal/routes/domain"
	routehttp "busiscoming-website/backend/internal/routes/interfaces/http"
	"github.com/gin-gonic/gin"
)

func TestHandlerQueryPlacesReturnsEnvelope(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	routehttp.RegisterRoutes(router, routehttp.NewHandler(fakeRouteService{}))

	body := `{"requestId":"req-places","language":"zh-Hans","query":"兴华","limit":100}`
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/routes/query_places", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), `"requestId":"req-places"`) ||
		!strings.Contains(recorder.Body.String(), `"placeToken":"place-token"`) {
		t.Fatalf("unexpected response body: %s", recorder.Body.String())
	}
}

func TestHandlerQueryRoutesReturnsEnvelope(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	routehttp.RegisterRoutes(router, routehttp.NewHandler(fakeRouteService{}))

	body := `{"requestId":"req-routes","language":"zh-Hans","originPlaceToken":"origin","destinationPlaceToken":"destination"}`
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/routes/query_routes", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), `"routeId":"route-1"`) {
		t.Fatalf("unexpected response body: %s", recorder.Body.String())
	}
}

type fakeRouteService struct{}

func (fakeRouteService) QueryPlaces(context.Context, routeapp.QueryPlacesRequest) (routeapp.QueryPlacesResult, *domain.QueryError) {
	expiresAt := time.Date(2026, 6, 16, 13, 0, 0, 0, time.UTC)
	return routeapp.QueryPlacesResult{
		Places: []domain.PlaceCandidate{{
			PlaceToken: "place-token",
			Name:       "兴华邨兴翠楼",
			Provider:   "citybus",
			ExpiresAt:  expiresAt,
		}},
		ExpiresAt: expiresAt,
	}, nil
}

func (fakeRouteService) QueryRoutes(context.Context, routeapp.QueryRoutesRequest) (routeapp.QueryRoutesResult, *domain.QueryError) {
	return routeapp.QueryRoutesResult{
		QueriedAt:   time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC),
		ResultLimit: 20,
		Routes: []domain.RouteOption{{
			RouteID:               "route-1",
			Operator:              "citybus",
			RouteNumbers:          []string{"606"},
			RouteLabel:            "606",
			BoardingStop:          domain.StopSummary{Name: "兴华邨兴翠楼", StopID: "001336"},
			AlightingStop:         domain.StopSummary{Name: "渔湾邨", StopID: "002180"},
			Fare:                  domain.MoneyAmount{Currency: "HKD", Amount: 6.1},
			DurationMinutes:       10,
			WalkingDistanceMeters: 266,
			SortIndex:             0,
		}},
	}, nil
}

func (fakeRouteService) QueryEtas(context.Context, routeapp.QueryEtasRequest) (routeapp.QueryEtasResult, *domain.QueryError) {
	return routeapp.QueryEtasResult{QueriedAt: time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)}, nil
}
