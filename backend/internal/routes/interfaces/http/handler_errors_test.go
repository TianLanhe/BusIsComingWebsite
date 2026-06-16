package http_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	routeapp "busiscoming-website/backend/internal/routes/application"
	"busiscoming-website/backend/internal/routes/domain"
	routehttp "busiscoming-website/backend/internal/routes/interfaces/http"
	"github.com/gin-gonic/gin"
)

func TestHandlerMapsRateLimitError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	routehttp.RegisterRoutes(router, routehttp.NewHandler(errorRouteService{}))

	body := `{"requestId":"req-limited","language":"zh-Hans","query":"兴华","limit":100}`
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/routes/query_places", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d body=%s", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), `"code":"RATE_LIMITED"`) {
		t.Fatalf("expected RATE_LIMITED envelope, got %s", recorder.Body.String())
	}
}

type errorRouteService struct{}

func (errorRouteService) QueryPlaces(context.Context, routeapp.QueryPlacesRequest) (routeapp.QueryPlacesResult, *domain.QueryError) {
	return routeapp.QueryPlacesResult{}, domain.NewQueryError(domain.ErrRateLimited, "too many requests")
}

func (errorRouteService) QueryRoutes(context.Context, routeapp.QueryRoutesRequest) (routeapp.QueryRoutesResult, *domain.QueryError) {
	return routeapp.QueryRoutesResult{}, domain.NewQueryError(domain.ErrRateLimited, "too many requests")
}

func (errorRouteService) QueryEtas(context.Context, routeapp.QueryEtasRequest) (routeapp.QueryEtasResult, *domain.QueryError) {
	return routeapp.QueryEtasResult{}, domain.NewQueryError(domain.ErrRateLimited, "too many requests")
}
